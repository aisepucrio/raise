package github

import (
	"context"
	"fmt"
	"slices"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"

	"raise/internal/apperr"
	"raise/internal/jobkit"
	"raise/internal/platform/git"
	"raise/internal/platform/github/sqlc"
)

// Resources that StartEnrichment accepts. Issues and pull requests include
// their comments and timeline events; pull requests also include commits,
// reviews and review comments. Commits are the mined commits' GitHub view
// (author and committer logins, signature, pull requests that introduced them).
// Releases include their assets. Users are the profiles of the accounts that
// the other resources refer to.
const (
	ResourceMetadata     = "metadata"
	ResourceIssues       = "issues"
	ResourcePullRequests = "pull_requests"
	ResourceCommits      = "commits"
	ResourceReleases     = "releases"
	ResourceUsers        = "users"
)

var supportedResources = []string{ResourceMetadata, ResourceIssues, ResourcePullRequests, ResourceCommits, ResourceReleases, ResourceUsers}

func (p *Platform) MatchRemote(host, path string) (git.RepoRef, bool) {
	if !slices.Contains(p.cfg.Hosts, host) {
		return git.RepoRef{}, false
	}
	owner, name, ok := strings.Cut(path, "/")
	if !ok || owner == "" || name == "" || strings.Contains(name, "/") {
		return git.RepoRef{}, false
	}
	return git.RepoRef{Platform: ID, Owner: owner, Name: name}, true
}

func (p *Platform) CloneAuth(ctx context.Context, _ git.RepoRef) (*git.CloneAuth, error) {
	lease, err := p.deps.Credentials.Lease(ctx, ID, ScopeCore)
	if err != nil {
		return nil, err
	}
	return &git.CloneAuth{Username: "x-access-token", Password: lease.Credential().Field("token")}, nil
}

func (p *Platform) StartEnrichment(ctx context.Context, tx pgx.Tx, enq jobkit.Enqueuer, repo git.Repository, ref git.RepoRef, req git.EnrichRequest) error {
	if len(req.Resources) == 0 {
		return fmt.Errorf("%w: github: no resources requested (supported: %s)", apperr.ErrInvalid, strings.Join(supportedResources, ", "))
	}
	// Accounts referenced by data this collection mines are fetched as each
	// batch is stored; PlanUsers covers (and refreshes) those mined before.
	users := slices.Contains(req.Resources, ResourceUsers)
	var jobs []river.InsertManyParams
	for _, r := range req.Resources {
		switch r {
		case ResourceMetadata:
			jobs = append(jobs, jobkit.Job(FetchRepositoryArgs{RepositoryID: repo.ID, Owner: ref.Owner, Name: ref.Name, Users: users}))
		case ResourceIssues:
			jobs = append(jobs, jobkit.Job(ListIssuesArgs{RepositoryID: repo.ID, Owner: ref.Owner, Name: ref.Name, Since: req.Since,
				CreatedSince: req.CreatedSince, CreatedUntil: req.CreatedUntil, Users: users}))
		case ResourcePullRequests:
			jobs = append(jobs, jobkit.Job(ListPullRequestsArgs{RepositoryID: repo.ID, Owner: ref.Owner, Name: ref.Name, Since: req.Since,
				CreatedSince: req.CreatedSince, CreatedUntil: req.CreatedUntil, Users: users}))
		case ResourceCommits:
			// Commits mined by this collection are enriched as they are
			// mined (OnCommitsMined); this covers those mined before.
			jobs = append(jobs, jobkit.Job(PlanCommitsArgs{RepositoryID: repo.ID, Owner: ref.Owner, Name: ref.Name, Users: users}))
		case ResourceReleases:
			// GitHub can't filter or order releases by update time, and
			// they are cheap, so Since doesn't apply: every run lists all
			// (in the creation window, if any).
			jobs = append(jobs, jobkit.Job(ListReleasesArgs{RepositoryID: repo.ID, Owner: ref.Owner, Name: ref.Name,
				CreatedSince: req.CreatedSince, CreatedUntil: req.CreatedUntil, Users: users}))
		case ResourceUsers:
			jobs = append(jobs, jobkit.Job(PlanUsersArgs{RepositoryID: repo.ID}))
		default:
			return fmt.Errorf("%w: github: unknown resource %q (supported: %s)", apperr.ErrInvalid, r, strings.Join(supportedResources, ", "))
		}
	}
	_, err := enq.Enqueue(ctx, tx, jobs...)
	return err
}

// OnCommitsMined enriches each mined batch when the collection requested
// commits.
func (p *Platform) OnCommitsMined(repo git.Repository, ref git.RepoRef, req git.EnrichRequest, shas []string) []river.InsertManyParams {
	if !slices.Contains(req.Resources, ResourceCommits) {
		return nil
	}
	return fetchCommitJobs(repo.ID, ref.Owner, ref.Name, slices.Contains(req.Resources, ResourceUsers), shas)
}

func fetchCommitJobs(repoID int64, owner, name string, users bool, shas []string) []river.InsertManyParams {
	var jobs []river.InsertManyParams
	for chunk := range slices.Chunk(shas, commitBatchSize) {
		jobs = append(jobs, jobkit.Job(FetchCommitsArgs{RepositoryID: repoID, Owner: owner, Name: name, SHAs: chunk, Users: users}))
	}
	return jobs
}

// RepositoryData describes the repository's GitHub data, one part per
// resource. Users are left out: profiles aren't tied to a repository.
func (p *Platform) RepositoryData(ctx context.Context, repoID int64) ([]git.DataPart, error) {
	c, err := p.q.RepositoryDataCounts(ctx, repoID)
	if err != nil {
		return nil, err
	}
	part := func(key, label, doc string, count int64, minedAt any) git.DataPart {
		return git.DataPart{Platform: ID, Key: key, Label: label, Description: doc, ItemCount: count, LastMinedAt: git.MinedAt(minedAt)}
	}
	commits := part(ResourceCommits, "Commit authors and PR links",
		"GitHub's view of the mined commits: logins, signatures and the pull requests that introduced them.",
		c.CommitCount, c.CommitLastMinedAt)
	commits.SharedCount = c.CommitSharedCount
	return []git.DataPart{
		part(ResourceMetadata, "Repository details", "Stars, forks, languages, topics, license, …", c.MetadataCount, c.MetadataLastMinedAt),
		part(ResourceIssues, "Issues", "Issues with their comments and timeline events.", c.IssueCount, c.IssueLastMinedAt),
		part(ResourcePullRequests, "Pull requests",
			"Pull requests with their comments, timeline events, commits, reviews and review comments.",
			c.PullRequestCount, c.PullRequestLastMinedAt),
		commits,
		part(ResourceReleases, "Releases", "Releases with their assets.", c.ReleaseCount, c.ReleaseLastMinedAt),
	}, nil
}

// DeleteRepositoryData removes one resource's data, with everything nested
// in it, in tx.
func (p *Platform) DeleteRepositoryData(ctx context.Context, tx pgx.Tx, repoID int64, key string) error {
	q := p.q.WithTx(tx)
	// The conversation side (github_issues) of issues or of pull requests,
	// with its comments and events, which are deleted first.
	conversations := func(isPullRequest bool) []func() error {
		return []func() error{
			func() error {
				return q.DeleteConversationComments(ctx, sqlc.DeleteConversationCommentsParams{RepositoryID: repoID, IsPullRequest: isPullRequest})
			},
			func() error {
				return q.DeleteConversationEvents(ctx, sqlc.DeleteConversationEventsParams{RepositoryID: repoID, IsPullRequest: isPullRequest})
			},
			func() error {
				return q.DeleteConversations(ctx, sqlc.DeleteConversationsParams{RepositoryID: repoID, IsPullRequest: isPullRequest})
			},
		}
	}
	var steps []func() error
	switch key {
	case ResourceMetadata:
		steps = []func() error{func() error { return q.DeleteRepositoryMetadata(ctx, repoID) }}
	case ResourceIssues:
		steps = conversations(false)
	case ResourcePullRequests:
		steps = append([]func() error{
			func() error { return q.DeletePullRequestCommits(ctx, repoID) },
			func() error { return q.DeletePullRequestReviewComments(ctx, repoID) },
			func() error { return q.DeletePullRequestReviews(ctx, repoID) },
			func() error { return q.DeletePullRequests(ctx, repoID) },
		}, conversations(true)...)
	case ResourceCommits:
		steps = []func() error{
			func() error { return q.DeleteCommitPullRequests(ctx, repoID) },
			func() error { return q.DeleteRepositoryGitHubCommits(ctx, repoID) },
		}
	case ResourceReleases:
		steps = []func() error{
			func() error { return q.DeleteReleaseAssets(ctx, repoID) },
			func() error { return q.DeleteReleases(ctx, repoID) },
		}
	default:
		return fmt.Errorf("%w: github has no data part %q", apperr.ErrNotFound, key)
	}
	for _, step := range steps {
		if err := step(); err != nil {
			return err
		}
	}
	return nil
}

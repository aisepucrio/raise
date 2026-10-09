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
)

// Resources that StartEnrichment accepts. Issues and pull requests include
// their comments and timeline events; pull requests also include commits,
// reviews and review comments. Commits are the mined commits' GitHub view
// (author and committer logins, signature, pull requests that introduced them).
const (
	ResourceMetadata     = "metadata"
	ResourceIssues       = "issues"
	ResourcePullRequests = "pull_requests"
	ResourceCommits      = "commits"
)

var supportedResources = []string{ResourceMetadata, ResourceIssues, ResourcePullRequests, ResourceCommits}

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
	var jobs []river.InsertManyParams
	for _, r := range req.Resources {
		switch r {
		case ResourceMetadata:
			jobs = append(jobs, jobkit.Job(FetchRepositoryArgs{RepositoryID: repo.ID, Owner: ref.Owner, Name: ref.Name}))
		case ResourceIssues:
			jobs = append(jobs, jobkit.Job(ListIssuesArgs{RepositoryID: repo.ID, Owner: ref.Owner, Name: ref.Name, Since: req.Since}))
		case ResourcePullRequests:
			jobs = append(jobs, jobkit.Job(ListPullRequestsArgs{RepositoryID: repo.ID, Owner: ref.Owner, Name: ref.Name, Since: req.Since}))
		case ResourceCommits:
			// Commits mined by this collection are enriched as they are
			// mined (OnCommitsMined); this covers those mined before.
			jobs = append(jobs, jobkit.Job(PlanCommitsArgs{RepositoryID: repo.ID, Owner: ref.Owner, Name: ref.Name}))
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
	return fetchCommitJobs(repo.ID, ref.Owner, ref.Name, shas)
}

func fetchCommitJobs(repoID int64, owner, name string, shas []string) []river.InsertManyParams {
	var jobs []river.InsertManyParams
	for chunk := range slices.Chunk(shas, commitBatchSize) {
		jobs = append(jobs, jobkit.Job(FetchCommitsArgs{RepositoryID: repoID, Owner: owner, Name: name, SHAs: chunk}))
	}
	return jobs
}

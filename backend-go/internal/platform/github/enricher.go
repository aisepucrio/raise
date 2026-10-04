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
// reviews and review comments.
const (
	ResourceMetadata     = "metadata"
	ResourceIssues       = "issues"
	ResourcePullRequests = "pull_requests"
)

var supportedResources = []string{ResourceMetadata, ResourceIssues, ResourcePullRequests}

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
		default:
			return fmt.Errorf("%w: github: unknown resource %q (supported: %s)", apperr.ErrInvalid, r, strings.Join(supportedResources, ", "))
		}
	}
	_, err := enq.Enqueue(ctx, tx, jobs...)
	return err
}

// OnCommitsMined will enqueue commit-level enrichment (author login, linked
// pull requests) once implemented.
func (p *Platform) OnCommitsMined(git.Repository, git.RepoRef, []string) []river.InsertManyParams {
	return nil
}

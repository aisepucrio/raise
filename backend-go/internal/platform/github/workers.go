package github

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"slices"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/rivertype"

	"raise/internal/jobkit"
	"raise/internal/platform/github/sqlc"
)

type fetchRepositoryWorker struct {
	river.WorkerDefaults[FetchRepositoryArgs]
	p *Platform
}

func (w *fetchRepositoryWorker) Work(ctx context.Context, job *river.Job[FetchRepositoryArgs]) error {
	a := job.Args
	var out struct {
		Repository *node[gqlRepository] `json:"repository"`
	}
	if err := w.p.client.Query(ctx, queryRepository, map[string]any{"owner": a.Owner, "name": a.Name}, &out); err != nil {
		return err
	}
	if out.Repository == nil {
		return notFound(a.Owner, a.Name)
	}
	row, err := repositoryRow(a.RepositoryID, *out.Repository)
	if err != nil {
		return err
	}
	return pgx.BeginFunc(ctx, w.p.deps.DB, func(tx pgx.Tx) error {
		q := w.p.q.WithTx(tx)
		if err := q.UpsertRepository(ctx, row); err != nil {
			return err
		}
		if !a.Users {
			return nil
		}
		jobs, err := unminedUserJobs(ctx, q, []string{row.OwnerLogin})
		if err != nil {
			return err
		}
		_, err = jobkit.FromJob(ctx, job.JobRow).Enqueue(ctx, tx, jobs...)
		return err
	})
}

type listIssuesWorker struct {
	river.WorkerDefaults[ListIssuesArgs]
	p *Platform
}

func (w *listIssuesWorker) Work(ctx context.Context, job *river.Job[ListIssuesArgs]) error {
	a := job.Args
	var out struct {
		Repository *struct {
			Issues conn[issueID] `json:"issues"`
		} `json:"repository"`
	}
	vars := map[string]any{"owner": a.Owner, "name": a.Name, "cursor": nilIfEmpty(a.Cursor), "since": a.Since}
	if err := w.p.client.Query(ctx, queryListIssues, vars, &out); err != nil {
		return err
	}
	if out.Repository == nil {
		return notFound(a.Owner, a.Name)
	}
	page := out.Repository.Issues
	nodes, pastWindow := inCreationWindow(page.Nodes, func(n issueID) time.Time { return n.CreatedAt }, a.CreatedSince, a.CreatedUntil)
	ids := make([]string, len(nodes))
	for i, n := range nodes {
		ids[i] = n.ID
	}

	var jobs []river.InsertManyParams
	for chunk := range slices.Chunk(ids, issueBatchSize) {
		jobs = append(jobs, jobkit.Job(FetchIssuesArgs{RepositoryID: a.RepositoryID, NodeIDs: chunk, Users: a.Users}))
	}
	if page.PageInfo.HasNextPage && !pastWindow {
		next := a
		next.Cursor = page.PageInfo.EndCursor
		jobs = append(jobs, jobkit.Job(next))
	}
	return w.p.enqueue(ctx, job.JobRow, nil, jobs)
}

type listPullRequestsWorker struct {
	river.WorkerDefaults[ListPullRequestsArgs]
	p *Platform
}

func (w *listPullRequestsWorker) Work(ctx context.Context, job *river.Job[ListPullRequestsArgs]) error {
	a := job.Args
	var out struct {
		Repository *struct {
			PullRequests conn[pullRequestID] `json:"pullRequests"`
		} `json:"repository"`
	}
	// A full run lists in creation order (stable cursors). An incremental run
	// lists the most recently updated first and stops at Since.
	field, direction := "CREATED_AT", "ASC"
	if a.Since != nil {
		field, direction = "UPDATED_AT", "DESC"
	}
	vars := map[string]any{"owner": a.Owner, "name": a.Name, "cursor": nilIfEmpty(a.Cursor), "field": field, "direction": direction}
	if err := w.p.client.Query(ctx, queryListPullRequests, vars, &out); err != nil {
		return err
	}
	if out.Repository == nil {
		return notFound(a.Owner, a.Name)
	}
	page := out.Repository.PullRequests
	var ids []string
	// A full run lists in creation order, so it stops past the creation
	// window; an incremental run stops at Since and filters by the window.
	created := func(n pullRequestID) time.Time { return n.CreatedAt }
	nodes, done := inCreationWindow(page.Nodes, created, a.CreatedSince, a.CreatedUntil)
	if a.Since != nil {
		nodes, done = nil, false
		for _, n := range page.Nodes {
			if n.UpdatedAt.Before(*a.Since) {
				done = true
				break
			}
			if kept, _ := inCreationWindow([]pullRequestID{n}, created, a.CreatedSince, a.CreatedUntil); len(kept) == 1 {
				nodes = append(nodes, n)
			}
		}
	}
	for _, n := range nodes {
		ids = append(ids, n.ID)
	}

	var jobs []river.InsertManyParams
	for chunk := range slices.Chunk(ids, pullRequestBatchSize) {
		jobs = append(jobs, jobkit.Job(FetchPullRequestsArgs{RepositoryID: a.RepositoryID, NodeIDs: chunk, Users: a.Users}))
	}
	if page.PageInfo.HasNextPage && !done {
		next := a
		next.Cursor = page.PageInfo.EndCursor
		jobs = append(jobs, jobkit.Job(next))
	}
	return w.p.enqueue(ctx, job.JobRow, nil, jobs)
}

type fetchIssuesWorker struct {
	river.WorkerDefaults[FetchIssuesArgs]
	p *Platform
}

func (w *fetchIssuesWorker) Work(ctx context.Context, job *river.Job[FetchIssuesArgs]) error {
	a := job.Args
	var out struct {
		Nodes []*node[gqlIssue] `json:"nodes"`
	}
	err := w.p.client.Query(ctx, queryFetchIssues, map[string]any{"ids": a.NodeIDs}, &out)
	if errors.Is(err, ErrQueryTimeout) && len(a.NodeIDs) > 1 {
		return w.p.split(ctx, job.JobRow, a.NodeIDs, func(ids []string) river.JobArgs {
			return FetchIssuesArgs{RepositoryID: a.RepositoryID, NodeIDs: ids, Users: a.Users}
		})
	}
	if err != nil {
		return err
	}
	b := &batch{repoID: a.RepositoryID, users: a.Users}
	for _, n := range out.Nodes {
		// Deleted or transferred issues come back as null.
		if n != nil && n.V.ID != "" {
			b.addIssue(*n)
		}
	}
	return w.p.enqueue(ctx, job.JobRow, b, b.jobs)
}

type fetchPullRequestsWorker struct {
	river.WorkerDefaults[FetchPullRequestsArgs]
	p *Platform
}

func (w *fetchPullRequestsWorker) Work(ctx context.Context, job *river.Job[FetchPullRequestsArgs]) error {
	a := job.Args
	var out struct {
		Nodes []*node[gqlPullRequest] `json:"nodes"`
	}
	err := w.p.client.Query(ctx, queryFetchPullRequests, map[string]any{"ids": a.NodeIDs}, &out)
	if errors.Is(err, ErrQueryTimeout) && len(a.NodeIDs) > 1 {
		return w.p.split(ctx, job.JobRow, a.NodeIDs, func(ids []string) river.JobArgs {
			return FetchPullRequestsArgs{RepositoryID: a.RepositoryID, NodeIDs: ids, Users: a.Users}
		})
	}
	if err != nil {
		return err
	}
	b := &batch{repoID: a.RepositoryID, users: a.Users}
	for _, n := range out.Nodes {
		if n != nil && n.V.ID != "" {
			b.addPullRequest(*n)
		}
	}
	return w.p.enqueue(ctx, job.JobRow, b, b.jobs)
}

type fetchConnectionWorker struct {
	river.WorkerDefaults[FetchConnectionArgs]
	p *Platform
}

func (w *fetchConnectionWorker) Work(ctx context.Context, job *river.Job[FetchConnectionArgs]) error {
	a := job.Args
	query, ok := connectionQueries[a.Connection]
	if !ok {
		return fmt.Errorf("%w: unknown connection %q", jobkit.ErrPermanent, a.Connection)
	}
	var out struct {
		Node *struct {
			Number      int32 `json:"number"`
			PullRequest *struct {
				Number int32 `json:"number"`
			} `json:"pullRequest"`
			Comments       conn[node[gqlComment]]       `json:"comments"`
			TimelineItems  conn[node[gqlTimelineItem]]  `json:"timelineItems"`
			Commits        conn[gqlPullRequestCommit]   `json:"commits"`
			Reviews        conn[node[gqlReview]]        `json:"reviews"`
			ReviewThreads  conn[gqlReviewThread]        `json:"reviewThreads"`
			ReviewComments conn[node[gqlReviewComment]] `json:"reviewComments"`
			gqlReleaseAssets
		} `json:"node"`
	}
	if err := w.p.client.Query(ctx, query, map[string]any{"id": a.NodeID, "cursor": a.Cursor}, &out); err != nil {
		return err
	}
	n := out.Node
	if n == nil {
		return nil // the parent was deleted since it was listed
	}
	b := &batch{repoID: a.RepositoryID, users: a.Users}
	switch a.Connection {
	case ConnIssueComments:
		b.addComments(a.NodeID, n.Number, n.Comments)
	case ConnTimelineItems:
		b.addTimeline(a.NodeID, n.Number, n.TimelineItems)
	case ConnPullRequestCommits:
		b.addCommits(a.NodeID, n.Number, a.Offset, n.Commits)
	case ConnPullRequestReviews:
		b.addReviews(a.NodeID, n.Number, n.Reviews)
	case ConnReviewThreads:
		b.addReviewThreads(a.NodeID, n.Number, n.ReviewThreads)
	case ConnThreadComments:
		if n.PullRequest == nil {
			return nil
		}
		b.addThreadComments(a.NodeID, n.PullRequest.Number, n.ReviewComments)
	case ConnReleaseAssets:
		if n.DatabaseID == nil {
			return nil
		}
		b.addReleaseAssets(a.NodeID, *n.DatabaseID, n.ReleaseAssets)
	}
	return w.p.enqueue(ctx, job.JobRow, b, b.jobs)
}

// insertChunk bounds the jobs per InsertMany call when planning fans out
// thousands of commit batches.
const insertChunk = 1_000

type planCommitsWorker struct {
	river.WorkerDefaults[PlanCommitsArgs]
	p *Platform
}

func (w *planCommitsWorker) Work(ctx context.Context, job *river.Job[PlanCommitsArgs]) error {
	a := job.Args
	shas, err := w.p.q.ListUnenrichedCommits(ctx, a.RepositoryID)
	if err != nil {
		return err
	}
	jobs := fetchCommitJobs(a.RepositoryID, a.Owner, a.Name, a.Users, shas)
	enq := jobkit.FromJob(ctx, job.JobRow)
	return pgx.BeginFunc(ctx, w.p.deps.DB, func(tx pgx.Tx) error {
		for chunk := range slices.Chunk(jobs, insertChunk) {
			if _, err := enq.Enqueue(ctx, tx, chunk...); err != nil {
				return err
			}
		}
		return nil
	})
}

type fetchCommitsWorker struct {
	river.WorkerDefaults[FetchCommitsArgs]
	p *Platform
}

func (w *fetchCommitsWorker) Work(ctx context.Context, job *river.Job[FetchCommitsArgs]) error {
	a := job.Args
	vars := map[string]any{"owner": a.Owner, "name": a.Name}
	for i, sha := range a.SHAs {
		vars["s"+strconv.Itoa(i)] = sha
	}
	var out struct {
		Repository map[string]json.RawMessage `json:"repository"`
	}
	err := w.p.client.Query(ctx, queryFetchCommits(len(a.SHAs)), vars, &out)
	if errors.Is(err, ErrQueryTimeout) && len(a.SHAs) > 1 {
		return w.p.split(ctx, job.JobRow, a.SHAs, func(shas []string) river.JobArgs {
			return FetchCommitsArgs{RepositoryID: a.RepositoryID, Owner: a.Owner, Name: a.Name, SHAs: shas, Users: a.Users}
		})
	}
	if err != nil {
		return err
	}
	if out.Repository == nil {
		return notFound(a.Owner, a.Name)
	}
	b, err := commitBatchFrom(a.RepositoryID, out.Repository, a.SHAs)
	if err != nil {
		return err
	}
	return pgx.BeginFunc(ctx, w.p.deps.DB, func(tx pgx.Tx) error {
		q := w.p.q.WithTx(tx)
		if err := b.write(ctx, q); err != nil {
			return err
		}
		if !a.Users {
			return nil
		}
		jobs, err := unminedUserJobs(ctx, q, b.logins())
		if err != nil {
			return err
		}
		_, err = jobkit.FromJob(ctx, job.JobRow).Enqueue(ctx, tx, jobs...)
		return err
	})
}

type listReleasesWorker struct {
	river.WorkerDefaults[ListReleasesArgs]
	p *Platform
}

func (w *listReleasesWorker) Work(ctx context.Context, job *river.Job[ListReleasesArgs]) error {
	a := job.Args
	var out struct {
		Repository *struct {
			Releases conn[node[gqlRelease]] `json:"releases"`
		} `json:"repository"`
	}
	vars := map[string]any{"owner": a.Owner, "name": a.Name, "cursor": nilIfEmpty(a.Cursor)}
	if err := w.p.client.Query(ctx, queryListReleases, vars, &out); err != nil {
		return err
	}
	if out.Repository == nil {
		return notFound(a.Owner, a.Name)
	}
	page := out.Repository.Releases
	b := &batch{repoID: a.RepositoryID, users: a.Users}
	releases, pastWindow := inCreationWindow(page.Nodes, func(n node[gqlRelease]) time.Time { return n.V.CreatedAt },
		a.CreatedSince, a.CreatedUntil)
	for _, n := range releases {
		b.addRelease(n)
	}
	b.jobs = append(b.jobs, releaseAssetBatches(a.RepositoryID, a.Users, releases)...)
	if page.PageInfo.HasNextPage && !pastWindow {
		next := a
		next.Cursor = page.PageInfo.EndCursor
		b.jobs = append(b.jobs, jobkit.Job(next))
	}
	return w.p.enqueue(ctx, job.JobRow, b, b.jobs)
}

type fetchReleaseAssetsWorker struct {
	river.WorkerDefaults[FetchReleaseAssetsArgs]
	p *Platform
}

func (w *fetchReleaseAssetsWorker) Work(ctx context.Context, job *river.Job[FetchReleaseAssetsArgs]) error {
	a := job.Args
	var out struct {
		Nodes []*gqlReleaseAssets `json:"nodes"`
	}
	err := w.p.client.Query(ctx, queryFetchReleaseAssets, map[string]any{"ids": a.NodeIDs}, &out)
	if errors.Is(err, ErrQueryTimeout) && len(a.NodeIDs) > 1 {
		return w.p.split(ctx, job.JobRow, a.NodeIDs, func(ids []string) river.JobArgs {
			return FetchReleaseAssetsArgs{RepositoryID: a.RepositoryID, NodeIDs: ids, Users: a.Users}
		})
	}
	if err != nil {
		return err
	}
	b := &batch{repoID: a.RepositoryID, users: a.Users}
	for _, n := range out.Nodes {
		// Deleted releases come back as null.
		if n != nil && n.ID != "" && n.DatabaseID != nil {
			b.addReleaseAssets(n.ID, *n.DatabaseID, n.ReleaseAssets)
		}
	}
	return w.p.enqueue(ctx, job.JobRow, b, b.jobs)
}

type planUsersWorker struct {
	river.WorkerDefaults[PlanUsersArgs]
	p *Platform
}

func (w *planUsersWorker) Work(ctx context.Context, job *river.Job[PlanUsersArgs]) error {
	logins, err := w.p.q.ListRepositoryLogins(ctx, job.Args.RepositoryID)
	if err != nil {
		return err
	}
	return w.p.enqueue(ctx, job.JobRow, nil, userJobs(logins))
}

type fetchUsersWorker struct {
	river.WorkerDefaults[FetchUsersArgs]
	p *Platform
}

func (w *fetchUsersWorker) Work(ctx context.Context, job *river.Job[FetchUsersArgs]) error {
	a := job.Args
	vars := make(map[string]any, len(a.Logins))
	for i, l := range a.Logins {
		vars["l"+strconv.Itoa(i)] = l
	}
	var out map[string]json.RawMessage
	err := w.p.client.Query(ctx, queryFetchUsers(len(a.Logins)), vars, &out)
	if errors.Is(err, ErrQueryTimeout) && len(a.Logins) > 1 {
		return w.p.split(ctx, job.JobRow, a.Logins, func(logins []string) river.JobArgs {
			return FetchUsersArgs{Logins: logins}
		})
	}
	if err != nil {
		return err
	}
	rows, err := usersFrom(out, a.Logins)
	if err != nil {
		return err
	}
	return pgx.BeginFunc(ctx, w.p.deps.DB, func(tx pgx.Tx) error {
		return writeUsers(ctx, w.p.q.WithTx(tx), rows)
	})
}

type fetchBotWorker struct {
	river.WorkerDefaults[FetchBotArgs]
	p *Platform
}

func (w *fetchBotWorker) Work(ctx context.Context, job *river.Job[FetchBotArgs]) error {
	var u node[restUser]
	found, err := w.p.client.Get(ctx, "/users/"+url.PathEscape(job.Args.Login), &u)
	if err != nil || !found {
		return err // a bot that no longer exists is skipped
	}
	return pgx.BeginFunc(ctx, w.p.deps.DB, func(tx pgx.Tx) error {
		return writeUsers(ctx, w.p.q.WithTx(tx), []sqlc.UpsertUserParams{botRow(job.Args.Login, u)})
	})
}

// enqueue writes b (if any) and inserts jobs in one transaction. When b
// requests users, it also enqueues fetches for its logins not yet mined.
func (p *Platform) enqueue(ctx context.Context, row *rivertype.JobRow, b *batch, jobs []river.InsertManyParams) error {
	return pgx.BeginFunc(ctx, p.deps.DB, func(tx pgx.Tx) error {
		q := p.q.WithTx(tx)
		if b != nil {
			if err := b.write(ctx, q); err != nil {
				return err
			}
			if b.users {
				users, err := unminedUserJobs(ctx, q, b.logins())
				if err != nil {
					return err
				}
				jobs = append(slices.Clip(jobs), users...)
			}
		}
		_, err := jobkit.FromJob(ctx, row).Enqueue(ctx, tx, jobs...)
		return err
	})
}

// split replaces a batch that timed out on GitHub's side with two halves.
func (p *Platform) split(ctx context.Context, row *rivertype.JobRow, ids []string, args func([]string) river.JobArgs) error {
	half := len(ids) / 2
	p.deps.Logger.Info("splitting GitHub batch after timeout", "kind", row.Kind, "size", len(ids))
	return p.enqueue(ctx, row, nil, []river.InsertManyParams{
		jobkit.Job(args(ids[:half])),
		jobkit.Job(args(ids[half:])),
	})
}

func notFound(owner, name string) error {
	return fmt.Errorf("%w: GitHub repository %s/%s not found or not readable with the pooled credentials", jobkit.ErrPermanent, owner, name)
}

func nilIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}

// issueID and pullRequestID are the nodes of the listing queries.
type issueID struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
}

type pullRequestID struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// inCreationWindow keeps the nodes created in [since, until) from a page
// listed in creation order; a nil bound is open. past reports that the page
// reached until, so the listing can stop: the remaining nodes are newer.
func inCreationWindow[T any](nodes []T, created func(T) time.Time, since, until *time.Time) (kept []T, past bool) {
	for _, n := range nodes {
		t := created(n)
		if until != nil && !t.Before(*until) {
			return kept, true
		}
		if since == nil || !t.Before(*since) {
			kept = append(kept, n)
		}
	}
	return kept, false
}

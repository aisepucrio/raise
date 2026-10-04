package github

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/rivertype"

	"raise/internal/jobkit"
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
	return w.p.q.UpsertRepository(ctx, row)
}

type listIssuesWorker struct {
	river.WorkerDefaults[ListIssuesArgs]
	p *Platform
}

func (w *listIssuesWorker) Work(ctx context.Context, job *river.Job[ListIssuesArgs]) error {
	a := job.Args
	var out struct {
		Repository *struct {
			Issues conn[struct {
				ID string `json:"id"`
			}] `json:"issues"`
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
	ids := make([]string, len(page.Nodes))
	for i, n := range page.Nodes {
		ids[i] = n.ID
	}

	var jobs []river.InsertManyParams
	for chunk := range slices.Chunk(ids, issueBatchSize) {
		jobs = append(jobs, jobkit.Job(FetchIssuesArgs{RepositoryID: a.RepositoryID, NodeIDs: chunk}))
	}
	if page.PageInfo.HasNextPage {
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
			PullRequests conn[struct {
				ID        string    `json:"id"`
				UpdatedAt time.Time `json:"updatedAt"`
			}] `json:"pullRequests"`
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
	reachedSince := false
	for _, n := range page.Nodes {
		if a.Since != nil && n.UpdatedAt.Before(*a.Since) {
			reachedSince = true
			break
		}
		ids = append(ids, n.ID)
	}

	var jobs []river.InsertManyParams
	for chunk := range slices.Chunk(ids, pullRequestBatchSize) {
		jobs = append(jobs, jobkit.Job(FetchPullRequestsArgs{RepositoryID: a.RepositoryID, NodeIDs: chunk}))
	}
	if page.PageInfo.HasNextPage && !reachedSince {
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
			return FetchIssuesArgs{RepositoryID: a.RepositoryID, NodeIDs: ids}
		})
	}
	if err != nil {
		return err
	}
	b := &batch{repoID: a.RepositoryID}
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
			return FetchPullRequestsArgs{RepositoryID: a.RepositoryID, NodeIDs: ids}
		})
	}
	if err != nil {
		return err
	}
	b := &batch{repoID: a.RepositoryID}
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
		} `json:"node"`
	}
	if err := w.p.client.Query(ctx, query, map[string]any{"id": a.NodeID, "cursor": a.Cursor}, &out); err != nil {
		return err
	}
	n := out.Node
	if n == nil {
		return nil // the parent was deleted since it was listed
	}
	b := &batch{repoID: a.RepositoryID}
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
	}
	return w.p.enqueue(ctx, job.JobRow, b, b.jobs)
}

// enqueue writes b (if any) and inserts jobs in one transaction.
func (p *Platform) enqueue(ctx context.Context, row *rivertype.JobRow, b *batch, jobs []river.InsertManyParams) error {
	return pgx.BeginFunc(ctx, p.deps.DB, func(tx pgx.Tx) error {
		if b != nil {
			if err := b.write(ctx, p.q.WithTx(tx)); err != nil {
				return err
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

package github

import (
	"context"
	"fmt"
	"net/url"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"

	"raise/internal/jobkit"
)

const perPage = 100

type planIssuesWorker struct {
	river.WorkerDefaults[PlanIssuesArgs]
	p *Platform
}

func (w *planIssuesWorker) Work(ctx context.Context, job *river.Job[PlanIssuesArgs]) error {
	a := job.Args
	issues, page, err := w.p.fetchIssues(ctx, a.Owner, a.Name, a.Since, 1)
	if err != nil {
		return err
	}
	var jobs []river.InsertManyParams
	for n := 2; n <= page.Last; n++ {
		jobs = append(jobs, jobkit.Job(FetchIssuePageArgs{
			RepositoryID: a.RepositoryID, Owner: a.Owner, Name: a.Name, Since: a.Since, Page: n,
		}))
	}
	return pgx.BeginFunc(ctx, w.p.deps.DB, func(tx pgx.Tx) error {
		if err := storeIssues(ctx, w.p.q.WithTx(tx), a.RepositoryID, issues); err != nil {
			return err
		}
		_, err := jobkit.FromJob(ctx, job.JobRow).Enqueue(ctx, tx, jobs...)
		return err
	})
}

type fetchIssuePageWorker struct {
	river.WorkerDefaults[FetchIssuePageArgs]
	p *Platform
}

func (w *fetchIssuePageWorker) Work(ctx context.Context, job *river.Job[FetchIssuePageArgs]) error {
	a := job.Args
	issues, _, err := w.p.fetchIssues(ctx, a.Owner, a.Name, a.Since, a.Page)
	if err != nil {
		return err
	}
	return storeIssues(ctx, w.p.q, a.RepositoryID, issues)
}

// fetchIssues lists issues (GitHub includes pull requests in this endpoint)
// in creation order, so page boundaries are stable while new issues arrive.
func (p *Platform) fetchIssues(ctx context.Context, owner, name string, since *time.Time, page int) ([]apiIssue, Page, error) {
	q := url.Values{
		"state":     {"all"},
		"sort":      {"created"},
		"direction": {"asc"},
		"per_page":  {strconv.Itoa(perPage)},
		"page":      {strconv.Itoa(page)},
	}
	if since != nil {
		q.Set("since", since.UTC().Format(time.RFC3339))
	}
	var issues []apiIssue
	pg, err := p.client.Get(ctx, ScopeCore, fmt.Sprintf("/repos/%s/%s/issues", url.PathEscape(owner), url.PathEscape(name)), q, &issues)
	return issues, pg, err
}

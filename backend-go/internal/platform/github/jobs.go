package github

import (
	"time"

	"github.com/riverqueue/river"

	"raise/internal/jobkit"
)

const queue = "github"

// PlanIssuesArgs fetches the first page of issues, learns the page count from
// the Link header and fans out one FetchIssuePage job per remaining page.
type PlanIssuesArgs struct {
	RepositoryID int64      `json:"repository_id"`
	Owner        string     `json:"owner"`
	Name         string     `json:"name"`
	Since        *time.Time `json:"since,omitempty"`
}

func (PlanIssuesArgs) Kind() string { return "github.plan_issues" }
func (PlanIssuesArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: queue, UniqueOpts: jobkit.UniqueInFlight()}
}

type FetchIssuePageArgs struct {
	RepositoryID int64      `json:"repository_id"`
	Owner        string     `json:"owner"`
	Name         string     `json:"name"`
	Since        *time.Time `json:"since,omitempty"`
	Page         int        `json:"page"`
}

func (FetchIssuePageArgs) Kind() string { return "github.fetch_issue_page" }
func (FetchIssuePageArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: queue, UniqueOpts: jobkit.UniqueInFlight()}
}

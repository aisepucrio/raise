package github

import (
	"time"

	"github.com/riverqueue/river"

	"raise/internal/jobkit"
)

const queue = "github"

func insertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: queue, UniqueOpts: jobkit.UniqueInFlight()}
}

// FetchRepositoryArgs fetches repository metadata (one GraphQL request).
type FetchRepositoryArgs struct {
	RepositoryID int64  `json:"repository_id"`
	Owner        string `json:"owner"`
	Name         string `json:"name"`
}

func (FetchRepositoryArgs) Kind() string                 { return "github.fetch_repository" }
func (FetchRepositoryArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// ListIssuesArgs lists one page of issue node IDs starting after Cursor. It
// fans out FetchIssues batches for that page and a ListIssues job for the
// next page, in the same transaction. GraphQL pagination is cursor-based, so
// listing is sequential; it is also cheap (IDs only), while the expensive
// fetches run in parallel.
type ListIssuesArgs struct {
	RepositoryID int64      `json:"repository_id"`
	Owner        string     `json:"owner"`
	Name         string     `json:"name"`
	Since        *time.Time `json:"since,omitempty"`
	Cursor       string     `json:"cursor,omitempty"`
}

func (ListIssuesArgs) Kind() string                 { return "github.list_issues" }
func (ListIssuesArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// FetchIssuesArgs fetches a batch of issues by node ID, with their labels,
// assignees and the first page of comments and timeline events.
type FetchIssuesArgs struct {
	RepositoryID int64    `json:"repository_id"`
	NodeIDs      []string `json:"node_ids"`
}

func (FetchIssuesArgs) Kind() string                 { return "github.fetch_issues" }
func (FetchIssuesArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// ListPullRequestsArgs is ListIssuesArgs for pull requests.
type ListPullRequestsArgs struct {
	RepositoryID int64      `json:"repository_id"`
	Owner        string     `json:"owner"`
	Name         string     `json:"name"`
	Since        *time.Time `json:"since,omitempty"`
	Cursor       string     `json:"cursor,omitempty"`
}

func (ListPullRequestsArgs) Kind() string                 { return "github.list_pull_requests" }
func (ListPullRequestsArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// FetchPullRequestsArgs fetches a batch of pull requests by node ID, with the
// first page of comments, timeline events, commits, reviews and review threads.
type FetchPullRequestsArgs struct {
	RepositoryID int64    `json:"repository_id"`
	NodeIDs      []string `json:"node_ids"`
}

func (FetchPullRequestsArgs) Kind() string                 { return "github.fetch_pull_requests" }
func (FetchPullRequestsArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// Nested connections that FetchConnection continues.
const (
	ConnIssueComments      = "issue_comments"       // Issue or PullRequest .comments
	ConnTimelineItems      = "timeline_items"       // Issue or PullRequest .timelineItems
	ConnPullRequestCommits = "pull_request_commits" // PullRequest .commits
	ConnPullRequestReviews = "pull_request_reviews" // PullRequest .reviews
	ConnReviewThreads      = "review_threads"       // PullRequest .reviewThreads
	ConnThreadComments     = "thread_comments"      // PullRequestReviewThread .comments
)

// FetchConnectionArgs fetches the page after Cursor of one nested connection
// of one node, when it didn't fit in the parent's batch. It chains itself
// while there are more pages. Offset is the number of items before this page
// (pull request commits store their position).
type FetchConnectionArgs struct {
	RepositoryID int64  `json:"repository_id"`
	Connection   string `json:"connection"`
	NodeID       string `json:"node_id"`
	Cursor       string `json:"cursor"`
	Offset       int    `json:"offset,omitempty"`
}

func (FetchConnectionArgs) Kind() string                 { return "github.fetch_connection" }
func (FetchConnectionArgs) InsertOpts() river.InsertOpts { return insertOpts() }

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
//
// Users, here and on every job that stores logins, also enqueues FetchUsers
// and FetchBot jobs for the stored logins that have no github_users row yet,
// in the same transaction. Jobs pass it on to the jobs they fan out.
type FetchRepositoryArgs struct {
	RepositoryID int64  `json:"repository_id"`
	Owner        string `json:"owner"`
	Name         string `json:"name"`
	Users        bool   `json:"users,omitempty"`
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
	CreatedSince *time.Time `json:"created_since,omitempty"`
	CreatedUntil *time.Time `json:"created_until,omitempty"`
	Cursor       string     `json:"cursor,omitempty"`
	Users        bool       `json:"users,omitempty"`
}

func (ListIssuesArgs) Kind() string                 { return "github.list_issues" }
func (ListIssuesArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// FetchIssuesArgs fetches a batch of issues by node ID, with their labels,
// assignees and the first page of comments and timeline events.
type FetchIssuesArgs struct {
	RepositoryID int64    `json:"repository_id"`
	NodeIDs      []string `json:"node_ids"`
	Users        bool     `json:"users,omitempty"`
}

func (FetchIssuesArgs) Kind() string                 { return "github.fetch_issues" }
func (FetchIssuesArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// ListPullRequestsArgs is ListIssuesArgs for pull requests.
type ListPullRequestsArgs struct {
	RepositoryID int64      `json:"repository_id"`
	Owner        string     `json:"owner"`
	Name         string     `json:"name"`
	Since        *time.Time `json:"since,omitempty"`
	CreatedSince *time.Time `json:"created_since,omitempty"`
	CreatedUntil *time.Time `json:"created_until,omitempty"`
	Cursor       string     `json:"cursor,omitempty"`
	Users        bool       `json:"users,omitempty"`
}

func (ListPullRequestsArgs) Kind() string                 { return "github.list_pull_requests" }
func (ListPullRequestsArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// FetchPullRequestsArgs fetches a batch of pull requests by node ID, with the
// first page of comments, timeline events, commits, reviews and review threads.
type FetchPullRequestsArgs struct {
	RepositoryID int64    `json:"repository_id"`
	NodeIDs      []string `json:"node_ids"`
	Users        bool     `json:"users,omitempty"`
}

func (FetchPullRequestsArgs) Kind() string                 { return "github.fetch_pull_requests" }
func (FetchPullRequestsArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// PlanCommitsArgs fans out FetchCommits batches for the repository's mined
// commits that have no GitHub view yet (github_commits).
type PlanCommitsArgs struct {
	RepositoryID int64  `json:"repository_id"`
	Owner        string `json:"owner"`
	Name         string `json:"name"`
	Users        bool   `json:"users,omitempty"`
}

func (PlanCommitsArgs) Kind() string                 { return "github.plan_commits" }
func (PlanCommitsArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// FetchCommitsArgs fetches GitHub's view of a batch of commits by SHA: author
// and committer logins, signature and the pull requests that introduced them.
type FetchCommitsArgs struct {
	RepositoryID int64    `json:"repository_id"`
	Owner        string   `json:"owner"`
	Name         string   `json:"name"`
	SHAs         []string `json:"shas"`
	Users        bool     `json:"users,omitempty"`
}

func (FetchCommitsArgs) Kind() string                 { return "github.fetch_commits" }
func (FetchCommitsArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// ListReleasesArgs fetches one page of releases after Cursor and stores them.
// Releases are light, so unlike issues they are stored while listing. Their
// assets are heavy for GitHub, so the page fans out FetchReleaseAssets
// batches, plus a ListReleases job for the next page.
type ListReleasesArgs struct {
	RepositoryID int64      `json:"repository_id"`
	Owner        string     `json:"owner"`
	Name         string     `json:"name"`
	CreatedSince *time.Time `json:"created_since,omitempty"`
	CreatedUntil *time.Time `json:"created_until,omitempty"`
	Cursor       string     `json:"cursor,omitempty"`
	Users        bool       `json:"users,omitempty"`
}

func (ListReleasesArgs) Kind() string                 { return "github.list_releases" }
func (ListReleasesArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// FetchReleaseAssetsArgs fetches the first page of assets of a batch of
// releases by node ID.
type FetchReleaseAssetsArgs struct {
	RepositoryID int64    `json:"repository_id"`
	NodeIDs      []string `json:"node_ids"`
	Users        bool     `json:"users,omitempty"`
}

func (FetchReleaseAssetsArgs) Kind() string                 { return "github.fetch_release_assets" }
func (FetchReleaseAssetsArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// Nested connections that FetchConnection continues.
const (
	ConnIssueComments      = "issue_comments"       // Issue or PullRequest .comments
	ConnTimelineItems      = "timeline_items"       // Issue or PullRequest .timelineItems
	ConnPullRequestCommits = "pull_request_commits" // PullRequest .commits
	ConnPullRequestReviews = "pull_request_reviews" // PullRequest .reviews
	ConnReviewThreads      = "review_threads"       // PullRequest .reviewThreads
	ConnThreadComments     = "thread_comments"      // PullRequestReviewThread .comments
	ConnReleaseAssets      = "release_assets"       // Release .releaseAssets
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
	Users        bool   `json:"users,omitempty"`
}

func (FetchConnectionArgs) Kind() string                 { return "github.fetch_connection" }
func (FetchConnectionArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// PlanUsersArgs fans out FetchUsers and FetchBot jobs for every account the
// repository's mined GitHub data refers to, refreshing profiles mined before.
type PlanUsersArgs struct {
	RepositoryID int64 `json:"repository_id"`
}

func (PlanUsersArgs) Kind() string                 { return "github.plan_users" }
func (PlanUsersArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// FetchUsersArgs fetches the profiles of a batch of users and organizations
// by login. Accounts are not tied to a repository.
type FetchUsersArgs struct {
	Logins []string `json:"logins"`
}

func (FetchUsersArgs) Kind() string                 { return "github.fetch_users" }
func (FetchUsersArgs) InsertOpts() river.InsertOpts { return insertOpts() }

// FetchBotArgs fetches one bot's profile through the REST API: GraphQL can't
// look bots up by login. Login is in REST form, e.g. "dependabot[bot]".
type FetchBotArgs struct {
	Login string `json:"login"`
}

func (FetchBotArgs) Kind() string                 { return "github.fetch_bot" }
func (FetchBotArgs) InsertOpts() river.InsertOpts { return insertOpts() }

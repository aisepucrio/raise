package github

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5"

	"raise/internal/apperr"
	"raise/internal/httpapi"
	"raise/internal/platform/github/sqlc"
)

type GitHubRepository struct {
	RepositoryID         int64           `json:"repository_id"`
	GithubID             int64           `json:"github_id"`
	GithubNodeID         string          `json:"github_node_id"`
	FullName             string          `json:"full_name"`
	Description          *string         `json:"description"`
	HomepageURL          *string         `json:"homepage_url"`
	DefaultBranch        *string         `json:"default_branch"`
	PrimaryLanguage      *string         `json:"primary_language"`
	LanguageBytes        json.RawMessage `json:"language_bytes"`
	TopicNames           []string        `json:"topic_names"`
	LicenseSpdxID        *string         `json:"license_spdx_id"`
	Visibility           string          `json:"visibility"`
	IsFork               bool            `json:"is_fork"`
	IsArchived           bool            `json:"is_archived"`
	IsTemplate           bool            `json:"is_template"`
	ParentFullName       *string         `json:"parent_full_name"`
	StarCount            int32           `json:"star_count"`
	WatcherCount         int32           `json:"watcher_count"`
	ForkCount            int32           `json:"fork_count"`
	OpenIssueCount       int32           `json:"open_issue_count"`
	OpenPullRequestCount int32           `json:"open_pull_request_count"`
	OwnerLogin           string          `json:"owner_login"`
	OwnerType            string          `json:"owner_type" doc:"User or Organization"`
	LabelCount           int32           `json:"label_count"`
	ReleaseCount         int32           `json:"release_count"`
	GithubCreatedAt      time.Time       `json:"github_created_at"`
	GithubUpdatedAt      time.Time       `json:"github_updated_at"`
	GithubPushedAt       *time.Time      `json:"github_pushed_at"`
	FirstMinedAt         time.Time       `json:"first_mined_at"`
	LastMinedAt          time.Time       `json:"last_mined_at"`
}

// GitHubRepositoryDetail adds what GraphQL doesn't provide and is computed from
// other tables when requested.
type GitHubRepositoryDetail struct {
	GitHubRepository
	ContributorCount *int32 `json:"contributor_count" doc:"Distinct commit authors in the mined commits: GitHub logins, plus emails of authors without one. Null until the repository's commits are mined"`
}

type GitHubIssue struct {
	Number            int32           `json:"number"`
	GithubID          int64           `json:"github_id"`
	Title             string          `json:"title"`
	State             string          `json:"state"`
	StateReason       *string         `json:"state_reason"`
	AuthorLogin       *string         `json:"author_login"`
	AuthorAssociation string          `json:"author_association"`
	LabelNames        []string        `json:"label_names"`
	AssigneeLogins    []string        `json:"assignee_logins"`
	MilestoneTitle    *string         `json:"milestone_title"`
	IsLocked          bool            `json:"is_locked"`
	CommentCount      int32           `json:"comment_count"`
	ReactionCounts    json.RawMessage `json:"reaction_counts"`
	IsPullRequest     bool            `json:"is_pull_request"`
	Body              *string         `json:"body,omitempty"`
	GithubCreatedAt   time.Time       `json:"github_created_at"`
	GithubUpdatedAt   time.Time       `json:"github_updated_at"`
	GithubClosedAt    *time.Time      `json:"github_closed_at,omitempty"`
	FirstMinedAt      time.Time       `json:"first_mined_at"`
	LastMinedAt       time.Time       `json:"last_mined_at"`
}

type GitHubIssueComment struct {
	GithubID          int64           `json:"github_id"`
	AuthorLogin       *string         `json:"author_login"`
	AuthorAssociation string          `json:"author_association"`
	Body              string          `json:"body"`
	ReactionCounts    json.RawMessage `json:"reaction_counts"`
	GithubCreatedAt   time.Time       `json:"github_created_at"`
	GithubUpdatedAt   time.Time       `json:"github_updated_at"`
	FirstMinedAt      time.Time       `json:"first_mined_at"`
	LastMinedAt       time.Time       `json:"last_mined_at"`
}

type GitHubIssueEvent struct {
	GithubNodeID    string          `json:"github_node_id"`
	EventType       string          `json:"event_type"`
	ActorLogin      *string         `json:"actor_login"`
	CommitSha       *string         `json:"commit_sha"`
	GithubCreatedAt time.Time       `json:"github_created_at"`
	RawPayload      json.RawMessage `json:"raw_payload"`
	FirstMinedAt    time.Time       `json:"first_mined_at"`
}

// GitHubIssueDetail is an issue or pull request conversation.
type GitHubIssueDetail struct {
	GitHubIssue
	Comments []GitHubIssueComment `json:"comments"`
	Events   []GitHubIssueEvent   `json:"events"`
}

type GitHubPullRequest struct {
	Number                  int32      `json:"number"`
	GithubID                int64      `json:"github_id"`
	Title                   string     `json:"title"`
	State                   string     `json:"state"`
	IsDraft                 bool       `json:"is_draft"`
	IsMerged                bool       `json:"is_merged"`
	AuthorLogin             *string    `json:"author_login"`
	MergedByLogin           *string    `json:"merged_by_login"`
	HeadRef                 string     `json:"head_ref"`
	HeadSha                 string     `json:"head_sha"`
	HeadRepositoryFullName  *string    `json:"head_repository_full_name"`
	BaseRef                 string     `json:"base_ref"`
	BaseSha                 string     `json:"base_sha"`
	MergeCommitSha          *string    `json:"merge_commit_sha"`
	CommitCount             int32      `json:"commit_count"`
	FilesChanged            int32      `json:"files_changed"`
	LinesAdded              int32      `json:"lines_added"`
	LinesDeleted            int32      `json:"lines_deleted"`
	CommentCount            int32      `json:"comment_count"`
	ReviewCount             int32      `json:"review_count"`
	ReviewThreadCount       int32      `json:"review_thread_count"`
	RequestedReviewerLogins []string   `json:"requested_reviewer_logins"`
	GithubCreatedAt         time.Time  `json:"github_created_at"`
	GithubUpdatedAt         time.Time  `json:"github_updated_at"`
	GithubClosedAt          *time.Time `json:"github_closed_at,omitempty"`
	GithubMergedAt          *time.Time `json:"github_merged_at,omitempty"`
	FirstMinedAt            time.Time  `json:"first_mined_at"`
	LastMinedAt             time.Time  `json:"last_mined_at"`
}

type GitHubPullRequestCommit struct {
	Position int32  `json:"position"`
	Sha      string `json:"sha"`
}

type GitHubPullRequestReview struct {
	GithubID          int64      `json:"github_id"`
	ReviewerLogin     *string    `json:"reviewer_login"`
	AuthorAssociation string     `json:"author_association"`
	State             string     `json:"state"`
	Body              string     `json:"body"`
	CommitSha         *string    `json:"commit_sha"`
	GithubSubmittedAt *time.Time `json:"github_submitted_at"`
	GithubUpdatedAt   time.Time  `json:"github_updated_at"`
	FirstMinedAt      time.Time  `json:"first_mined_at"`
	LastMinedAt       time.Time  `json:"last_mined_at"`
}

type GitHubPullRequestReviewComment struct {
	GithubID           int64     `json:"github_id"`
	ReviewGithubID     *int64    `json:"review_github_id"`
	InReplyToGithubID  *int64    `json:"in_reply_to_github_id"`
	ThreadGithubNodeID string    `json:"thread_github_node_id"`
	AuthorLogin        *string   `json:"author_login"`
	AuthorAssociation  string    `json:"author_association"`
	Path               string    `json:"path"`
	Line               *int32    `json:"line"`
	OriginalLine       *int32    `json:"original_line"`
	CommitSha          *string   `json:"commit_sha"`
	DiffHunk           string    `json:"diff_hunk"`
	Body               string    `json:"body"`
	GithubCreatedAt    time.Time `json:"github_created_at"`
	GithubUpdatedAt    time.Time `json:"github_updated_at"`
	FirstMinedAt       time.Time `json:"first_mined_at"`
	LastMinedAt        time.Time `json:"last_mined_at"`
}

// GitHubPullRequestDetail is a pull request's code-review side; its conversation
// (body, comments, events) is served by the issue endpoint with the same number.
type GitHubPullRequestDetail struct {
	GitHubPullRequest
	Commits        []GitHubPullRequestCommit        `json:"commits"`
	Reviews        []GitHubPullRequestReview        `json:"reviews"`
	ReviewComments []GitHubPullRequestReviewComment `json:"review_comments"`
}

// GitHubCommit is GitHub's view of a mined commit; the commit itself is
// served by GET /api/repositories/{id}/commits/{sha}.
type GitHubCommit struct {
	Sha                 string    `json:"sha"`
	GithubNodeID        string    `json:"github_node_id"`
	AuthorLogin         *string   `json:"author_login"`
	CommitterLogin      *string   `json:"committer_login"`
	IsSignatureVerified bool      `json:"is_signature_verified"`
	PullRequestNumbers  []int32   `json:"pull_request_numbers" doc:"Pull requests of this repository that introduced the commit"`
	FirstMinedAt        time.Time `json:"first_mined_at"`
	LastMinedAt         time.Time `json:"last_mined_at"`
}

type itemPath struct {
	ID     int64 `path:"id"`
	Number int32 `path:"number"`
}

func (p *Platform) registerRoutes(api huma.API) {
	tags := []string{"github"}

	huma.Register(api, huma.Operation{
		OperationID: "github-get-repository", Method: http.MethodGet, Path: "/api/github/repositories/{id}",
		Summary: "Get mined GitHub metadata of a repository", Tags: tags,
	}, func(ctx context.Context, in *struct {
		ID int64 `path:"id"`
	}) (*struct{ Body GitHubRepositoryDetail }, error) {
		r, err := p.q.GetRepository(ctx, in.ID)
		if err != nil {
			return nil, httpapi.Error(lookupErr(err, "GitHub metadata for repository %d", in.ID))
		}
		c, err := p.q.CountContributors(ctx, in.ID)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		out := GitHubRepositoryDetail{GitHubRepository: GitHubRepository(r)}
		if c.CommitCount > 0 {
			out.ContributorCount = &c.ContributorCount
		}
		return &struct{ Body GitHubRepositoryDetail }{out}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "github-list-issues", Method: http.MethodGet, Path: "/api/github/repositories/{id}/issues",
		Summary: "List mined GitHub issues and pull requests of a repository", Tags: tags,
	}, func(ctx context.Context, in *struct {
		ID    int64  `path:"id"`
		State string `query:"state" enum:"open,closed"`
		Kind  string `query:"kind" enum:"issue,pull_request"`
		httpapi.Page
	}) (*struct{ Body []GitHubIssue }, error) {
		params := sqlc.ListIssuesParams{RepositoryID: in.ID, Limit: in.Limit, Offset: in.Offset}
		if in.State != "" {
			params.State = &in.State
		}
		if in.Kind != "" {
			params.IsPullRequest = new(in.Kind == "pull_request")
		}
		rows, err := p.q.ListIssues(ctx, params)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		out := make([]GitHubIssue, len(rows))
		for i, r := range rows {
			out[i] = GitHubIssue{
				Number: r.Number, GithubID: r.GithubID, Title: r.Title, State: r.State, StateReason: r.StateReason,
				AuthorLogin: r.AuthorLogin, AuthorAssociation: r.AuthorAssociation,
				LabelNames: r.LabelNames, AssigneeLogins: r.AssigneeLogins, MilestoneTitle: r.MilestoneTitle,
				IsLocked: r.IsLocked, CommentCount: r.CommentCount, ReactionCounts: r.ReactionCounts,
				IsPullRequest: r.IsPullRequest, GithubCreatedAt: r.GithubCreatedAt, GithubUpdatedAt: r.GithubUpdatedAt,
				GithubClosedAt: r.GithubClosedAt, FirstMinedAt: r.FirstMinedAt, LastMinedAt: r.LastMinedAt,
			}
		}
		return &struct{ Body []GitHubIssue }{out}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "github-get-issue", Method: http.MethodGet, Path: "/api/github/repositories/{id}/issues/{number}",
		Summary: "Get a GitHub issue or pull request conversation with its comments and timeline events", Tags: tags,
	}, func(ctx context.Context, in *itemPath) (*struct{ Body GitHubIssueDetail }, error) {
		d, err := p.issueDetail(ctx, in.ID, in.Number)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body GitHubIssueDetail }{d}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "github-list-pull-requests", Method: http.MethodGet, Path: "/api/github/repositories/{id}/pull-requests",
		Summary: "List mined GitHub pull requests of a repository", Tags: tags,
	}, func(ctx context.Context, in *struct {
		ID     int64  `path:"id"`
		State  string `query:"state" enum:"open,closed"`
		Merged string `query:"merged" enum:"true,false"`
		httpapi.Page
	}) (*struct{ Body []GitHubPullRequest }, error) {
		params := sqlc.ListPullRequestsParams{RepositoryID: in.ID, Limit: in.Limit, Offset: in.Offset}
		if in.State != "" {
			params.State = &in.State
		}
		if in.Merged != "" {
			params.IsMerged = new(in.Merged == "true")
		}
		rows, err := p.q.ListPullRequests(ctx, params)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		out := make([]GitHubPullRequest, len(rows))
		for i, r := range rows {
			out[i] = GitHubPullRequest(r)
		}
		return &struct{ Body []GitHubPullRequest }{out}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "github-get-pull-request", Method: http.MethodGet, Path: "/api/github/repositories/{id}/pull-requests/{number}",
		Summary: "Get a GitHub pull request with its commits, reviews and review comments", Tags: tags,
	}, func(ctx context.Context, in *itemPath) (*struct{ Body GitHubPullRequestDetail }, error) {
		d, err := p.pullRequestDetail(ctx, in.ID, in.Number)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body GitHubPullRequestDetail }{d}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "github-get-commit", Method: http.MethodGet, Path: "/api/github/repositories/{id}/commits/{sha}",
		Summary: "Get GitHub's view of a mined commit: logins, signature and the pull requests that introduced it", Tags: tags,
	}, func(ctx context.Context, in *struct {
		ID  int64  `path:"id"`
		Sha string `path:"sha"`
	}) (*struct{ Body GitHubCommit }, error) {
		c, err := p.commit(ctx, in.ID, in.Sha)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body GitHubCommit }{c}, nil
	})
}

func (p *Platform) commit(ctx context.Context, repoID int64, sha string) (GitHubCommit, error) {
	c, err := p.q.GetCommit(ctx, sqlc.GetCommitParams{RepositoryID: repoID, Sha: sha})
	if err != nil {
		return GitHubCommit{}, lookupErr(err, "GitHub commit %s", sha)
	}
	numbers, err := p.q.ListCommitPullRequestNumbers(ctx, sqlc.ListCommitPullRequestNumbersParams{RepositoryID: repoID, Sha: sha})
	if err != nil {
		return GitHubCommit{}, err
	}
	return GitHubCommit{
		Sha: c.Sha, GithubNodeID: c.GithubNodeID, AuthorLogin: c.AuthorLogin, CommitterLogin: c.CommitterLogin,
		IsSignatureVerified: c.IsSignatureVerified, PullRequestNumbers: append([]int32{}, numbers...),
		FirstMinedAt: c.FirstMinedAt, LastMinedAt: c.LastMinedAt,
	}, nil
}

func (p *Platform) issueDetail(ctx context.Context, repoID int64, number int32) (GitHubIssueDetail, error) {
	r, err := p.q.GetIssue(ctx, sqlc.GetIssueParams{RepositoryID: repoID, Number: number})
	if err != nil {
		return GitHubIssueDetail{}, lookupErr(err, "GitHub issue #%d", number)
	}
	d := GitHubIssueDetail{GitHubIssue: GitHubIssue{
		Number: r.Number, GithubID: r.GithubID, Title: r.Title, State: r.State, StateReason: r.StateReason,
		AuthorLogin: r.AuthorLogin, AuthorAssociation: r.AuthorAssociation,
		LabelNames: r.LabelNames, AssigneeLogins: r.AssigneeLogins, MilestoneTitle: r.MilestoneTitle,
		IsLocked: r.IsLocked, CommentCount: r.CommentCount, ReactionCounts: r.ReactionCounts,
		IsPullRequest: r.IsPullRequest, Body: r.Body, GithubCreatedAt: r.GithubCreatedAt,
		GithubUpdatedAt: r.GithubUpdatedAt, GithubClosedAt: r.GithubClosedAt,
		FirstMinedAt: r.FirstMinedAt, LastMinedAt: r.LastMinedAt,
	}}
	comments, err := p.q.ListIssueComments(ctx, sqlc.ListIssueCommentsParams{RepositoryID: repoID, IssueNumber: number})
	if err != nil {
		return GitHubIssueDetail{}, err
	}
	d.Comments = make([]GitHubIssueComment, len(comments))
	for i, c := range comments {
		d.Comments[i] = GitHubIssueComment{
			GithubID: c.GithubID, AuthorLogin: c.AuthorLogin, AuthorAssociation: c.AuthorAssociation,
			Body: c.Body, ReactionCounts: c.ReactionCounts, GithubCreatedAt: c.GithubCreatedAt,
			GithubUpdatedAt: c.GithubUpdatedAt, FirstMinedAt: c.FirstMinedAt, LastMinedAt: c.LastMinedAt,
		}
	}
	events, err := p.q.ListIssueEvents(ctx, sqlc.ListIssueEventsParams{RepositoryID: repoID, IssueNumber: number})
	if err != nil {
		return GitHubIssueDetail{}, err
	}
	d.Events = make([]GitHubIssueEvent, len(events))
	for i, e := range events {
		d.Events[i] = GitHubIssueEvent{
			GithubNodeID: e.GithubNodeID, EventType: e.EventType, ActorLogin: e.ActorLogin, CommitSha: e.CommitSha,
			GithubCreatedAt: e.GithubCreatedAt, RawPayload: e.RawPayload, FirstMinedAt: e.FirstMinedAt,
		}
	}
	return d, nil
}

func (p *Platform) pullRequestDetail(ctx context.Context, repoID int64, number int32) (GitHubPullRequestDetail, error) {
	r, err := p.q.GetPullRequest(ctx, sqlc.GetPullRequestParams{RepositoryID: repoID, Number: number})
	if err != nil {
		return GitHubPullRequestDetail{}, lookupErr(err, "GitHub pull request #%d", number)
	}
	d := GitHubPullRequestDetail{GitHubPullRequest: GitHubPullRequest(r)}
	commits, err := p.q.ListPullRequestCommits(ctx, sqlc.ListPullRequestCommitsParams{RepositoryID: repoID, PullRequestNumber: number})
	if err != nil {
		return GitHubPullRequestDetail{}, err
	}
	d.Commits = make([]GitHubPullRequestCommit, len(commits))
	for i, c := range commits {
		d.Commits[i] = GitHubPullRequestCommit(c)
	}
	reviews, err := p.q.ListPullRequestReviews(ctx, sqlc.ListPullRequestReviewsParams{RepositoryID: repoID, PullRequestNumber: number})
	if err != nil {
		return GitHubPullRequestDetail{}, err
	}
	d.Reviews = make([]GitHubPullRequestReview, len(reviews))
	for i, rv := range reviews {
		d.Reviews[i] = GitHubPullRequestReview{
			GithubID: rv.GithubID, ReviewerLogin: rv.ReviewerLogin, AuthorAssociation: rv.AuthorAssociation,
			State: rv.State, Body: rv.Body, CommitSha: rv.CommitSha, GithubSubmittedAt: rv.GithubSubmittedAt,
			GithubUpdatedAt: rv.GithubUpdatedAt, FirstMinedAt: rv.FirstMinedAt, LastMinedAt: rv.LastMinedAt,
		}
	}
	comments, err := p.q.ListPullRequestReviewComments(ctx, sqlc.ListPullRequestReviewCommentsParams{RepositoryID: repoID, PullRequestNumber: number})
	if err != nil {
		return GitHubPullRequestDetail{}, err
	}
	d.ReviewComments = make([]GitHubPullRequestReviewComment, len(comments))
	for i, c := range comments {
		d.ReviewComments[i] = GitHubPullRequestReviewComment{
			GithubID: c.GithubID, ReviewGithubID: c.ReviewGithubID, InReplyToGithubID: c.InReplyToGithubID,
			ThreadGithubNodeID: c.ThreadGithubNodeID, AuthorLogin: c.AuthorLogin, AuthorAssociation: c.AuthorAssociation,
			Path: c.Path, Line: c.Line, OriginalLine: c.OriginalLine, CommitSha: c.CommitSha, DiffHunk: c.DiffHunk,
			Body: c.Body, GithubCreatedAt: c.GithubCreatedAt, GithubUpdatedAt: c.GithubUpdatedAt,
			FirstMinedAt: c.FirstMinedAt, LastMinedAt: c.LastMinedAt,
		}
	}
	return d, nil
}

func lookupErr(err error, format string, args ...any) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("%w: %s not mined", apperr.ErrNotFound, fmt.Sprintf(format, args...))
	}
	return err
}

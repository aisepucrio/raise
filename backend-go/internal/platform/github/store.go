package github

import (
	"context"
	"encoding/json"
	"time"

	"raise/internal/platform/github/sqlc"
)

// apiIssue is the subset of GitHub's issue payload modelled in columns; the
// full payload is kept in the raw_payload column.
type apiIssue struct {
	ID     int64  `json:"id"`
	Number int32  `json:"number"`
	Title  string `json:"title"`
	State  string `json:"state"`
	User   *struct {
		Login string `json:"login"`
	} `json:"user"`
	Labels []struct {
		Name string `json:"name"`
	} `json:"labels"`
	Assignees []struct {
		Login string `json:"login"`
	} `json:"assignees"`
	Comments    int32           `json:"comments"`
	PullRequest json.RawMessage `json:"pull_request"`
	Body        *string         `json:"body"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	ClosedAt    *time.Time      `json:"closed_at"`

	raw json.RawMessage
}

func (i *apiIssue) UnmarshalJSON(b []byte) error {
	type plain apiIssue
	if err := json.Unmarshal(b, (*plain)(i)); err != nil {
		return err
	}
	i.raw = append(json.RawMessage(nil), b...)
	return nil
}

func storeIssues(ctx context.Context, q *sqlc.Queries, repoID int64, issues []apiIssue) error {
	if len(issues) == 0 {
		return nil
	}
	params := make([]sqlc.UpsertIssueParams, len(issues))
	for i, is := range issues {
		p := sqlc.UpsertIssueParams{
			RepositoryID: repoID, Number: is.Number, GithubID: is.ID,
			Title: is.Title, State: is.State,
			LabelNames: []string{}, AssigneeLogins: []string{},
			CommentCount: is.Comments, IsPullRequest: len(is.PullRequest) > 0 && string(is.PullRequest) != "null",
			Body: is.Body, GithubCreatedAt: is.CreatedAt, GithubUpdatedAt: is.UpdatedAt, GithubClosedAt: is.ClosedAt,
			RawPayload: is.raw,
		}
		if is.User != nil {
			p.AuthorLogin = &is.User.Login
		}
		for _, l := range is.Labels {
			p.LabelNames = append(p.LabelNames, l.Name)
		}
		for _, a := range is.Assignees {
			p.AssigneeLogins = append(p.AssigneeLogins, a.Login)
		}
		params[i] = p
	}

	var first error
	b := q.UpsertIssue(ctx, params)
	b.Exec(func(_ int, err error) {
		if err != nil && first == nil {
			first = err
		}
	})
	if err := b.Close(); err != nil && first == nil {
		first = err
	}
	return first
}

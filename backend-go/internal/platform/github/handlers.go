package github

import (
	"context"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"raise/internal/httpapi"
	"raise/internal/platform/github/sqlc"
)

type Issue struct {
	Number        int32      `json:"number"`
	GithubID      int64      `json:"github_id"`
	Title         string     `json:"title"`
	State         string     `json:"state"`
	AuthorLogin   *string    `json:"author_login"`
	Labels        []string   `json:"labels"`
	Assignees     []string   `json:"assignees"`
	CommentsCount int32      `json:"comments_count"`
	IsPullRequest bool       `json:"is_pull_request"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	ClosedAt      *time.Time `json:"closed_at,omitempty"`
}

func (p *Platform) registerRoutes(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "github-list-issues", Method: http.MethodGet, Path: "/api/github/repositories/{id}/issues",
		Summary: "List mined GitHub issues and pull requests of a repository", Tags: []string{"github"},
	}, func(ctx context.Context, in *struct {
		ID    int64  `path:"id"`
		State string `query:"state" enum:"open,closed"`
		Kind  string `query:"kind" enum:"issue,pull_request"`
		httpapi.Page
	}) (*struct{ Body []Issue }, error) {
		params := sqlc.ListIssuesParams{RepositoryID: in.ID, Limit: in.Limit, Offset: in.Offset}
		if in.State != "" {
			params.State = &in.State
		}
		if in.Kind != "" {
			isPR := in.Kind == "pull_request"
			params.IsPullRequest = &isPR
		}
		rows, err := p.q.ListIssues(ctx, params)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		out := make([]Issue, len(rows))
		for i, r := range rows {
			out[i] = Issue{
				Number: r.Number, GithubID: r.GithubID, Title: r.Title, State: r.State,
				AuthorLogin: r.AuthorLogin, Labels: r.Labels, Assignees: r.Assignees,
				CommentsCount: r.CommentsCount, IsPullRequest: r.IsPullRequest,
				CreatedAt: r.CreatedAt, UpdatedAt: r.UpdatedAt, ClosedAt: r.ClosedAt,
			}
		}
		return &struct{ Body []Issue }{out}, nil
	})
}

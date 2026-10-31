package git

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"raise/internal/access"
	"raise/internal/httpapi"
)

type repositoryOutput struct{ Body Repository }

func (p *Platform) registerRoutes(api huma.API) {
	tags := []string{"repositories"}

	huma.Register(api, huma.Operation{
		OperationID: "register-repository", Method: http.MethodPost, Path: "/api/repositories",
		Summary: "Register a repository (idempotent)", Tags: tags,
		Metadata: access.Require(access.Researcher),
	}, func(ctx context.Context, in *struct {
		Body struct {
			URL string `json:"url" example:"https://github.com/golang/go"`
		}
	}) (*repositoryOutput, error) {
		repo, err := p.Register(ctx, in.Body.URL)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &repositoryOutput{Body: repo}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-repository", Method: http.MethodGet, Path: "/api/repositories/{id}",
		Summary: "Get a repository", Tags: tags,
	}, func(ctx context.Context, in *struct {
		ID int64 `path:"id"`
	}) (*repositoryOutput, error) {
		repo, err := p.GetRepository(ctx, in.ID)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &repositoryOutput{Body: repo}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-commit", Method: http.MethodGet, Path: "/api/repositories/{id}/commits/{sha}",
		Summary: "Get a commit with its changed files", Tags: tags,
	}, func(ctx context.Context, in *struct {
		ID    int64  `path:"id"`
		SHA   string `path:"sha" pattern:"^[0-9a-f]{40}$"`
		Diffs bool   `query:"diffs" doc:"Include each file's diff, if a collection with diffs mined them"`
	}) (*struct{ Body Commit }, error) {
		c, err := p.GetCommit(ctx, in.ID, in.SHA, in.Diffs)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body Commit }{c}, nil
	})
}

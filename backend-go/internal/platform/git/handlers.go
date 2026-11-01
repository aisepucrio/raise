package git

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"raise/internal/access"
	"raise/internal/httpapi"
	"raise/internal/platform"
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

	huma.Register(api, huma.Operation{
		OperationID: "delete-repository", Method: http.MethodDelete, Path: "/api/repositories/{id}",
		Summary: "Delete a repository and everything mined for it",
		Description: "Commits that other repositories (forks) also contain are kept for them. " +
			"Refused with 409 while jobs of the repository are queued or running.",
		Tags: tags, Metadata: access.Require(access.Admin), DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *struct {
		ID int64 `path:"id"`
	}) (*struct{}, error) {
		return nil, httpapi.Error(p.DeleteRepository(ctx, in.ID))
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-repository-data", Method: http.MethodGet, Path: "/api/repositories/{id}/data",
		Summary: "Summarise what was mined for a repository, part by part", Tags: tags,
	}, func(ctx context.Context, in *struct {
		ID int64 `path:"id"`
	}) (*struct{ Body RepositoryData }, error) {
		d, err := p.RepositoryData(ctx, in.ID)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body RepositoryData }{d}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "delete-repository-data", Method: http.MethodDelete, Path: "/api/repositories/{id}/data/{platform}/{key}",
		Summary: "Remove one part of what was mined for a repository",
		Description: "Returns what remains. Items that other repositories also contain (shared_count) are kept for them. " +
			"Refused with 409 while jobs of the repository are queued or running.",
		Tags: tags, Metadata: access.Require(access.Admin),
	}, func(ctx context.Context, in *struct {
		ID       int64  `path:"id"`
		Platform string `path:"platform" example:"github"`
		Key      string `path:"key" example:"issues"`
	}) (*struct{ Body RepositoryData }, error) {
		d, err := p.DeleteRepositoryData(ctx, in.ID, platform.ID(in.Platform), in.Key)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body RepositoryData }{d}, nil
	})
}

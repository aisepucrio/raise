package collection

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"raise/internal/access"
	"raise/internal/httpapi"
	"raise/internal/platform"
)

type collectionOutput struct{ Body Collection }

func (s *Service) RegisterRoutes(api huma.API) {
	tags := []string{"collections"}

	huma.Register(api, huma.Operation{
		OperationID: "start-collection", Method: http.MethodPost, Path: "/api/collections",
		Summary:     "Start a collection",
		Description: "parameters are platform specific; e.g. for git: {\"repository_id\": 1, \"commits\": true, \"enrich\": {\"github\": {\"resources\": [\"issues\"]}}}",
		Tags:        tags, Metadata: access.Require(access.Researcher), DefaultStatus: http.StatusAccepted,
	}, func(ctx context.Context, in *struct {
		Body struct {
			Platform   platform.ID     `json:"platform"`
			Parameters json.RawMessage `json:"parameters,omitempty"`
		}
	}) (*collectionOutput, error) {
		p, _ := access.FromContext(ctx)
		c, err := s.Start(ctx, p.UserID, in.Body.Platform, in.Body.Parameters)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &collectionOutput{Body: c}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-collections", Method: http.MethodGet, Path: "/api/collections",
		Summary: "List collections", Tags: tags,
	}, func(ctx context.Context, in *httpapi.Page) (*struct{ Body []Collection }, error) {
		cs, err := s.List(ctx, in.Limit, in.Offset)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body []Collection }{cs}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-collection", Method: http.MethodGet, Path: "/api/collections/{id}",
		Summary: "Get a collection and its progress", Tags: tags,
	}, func(ctx context.Context, in *struct {
		ID int64 `path:"id"`
	}) (*collectionOutput, error) {
		c, err := s.Get(ctx, in.ID)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &collectionOutput{Body: c}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-collection-errors", Method: http.MethodGet, Path: "/api/collections/{id}/errors",
		Summary:     "List a collection's failed job attempts",
		Description: "Every failed attempt of the collection's jobs, oldest first, kept after the job queue deletes its jobs. is_final marks jobs that were given up; the others were retried. Rate-limit snoozes are not errors.",
		Tags:        tags,
	}, func(ctx context.Context, in *struct {
		ID int64 `path:"id"`
		httpapi.Page
	}) (*struct{ Body []JobError }, error) {
		errs, err := s.ListJobErrors(ctx, in.ID, in.Limit, in.Offset)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body []JobError }{errs}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "cancel-collection", Method: http.MethodPost, Path: "/api/collections/{id}/cancel",
		Summary: "Cancel a running collection", Tags: tags,
		Metadata: access.Require(access.Researcher), DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *struct {
		ID int64 `path:"id"`
	}) (*struct{}, error) {
		return nil, httpapi.Error(s.Cancel(ctx, in.ID))
	})
}

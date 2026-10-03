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
		Description: "params are platform specific; e.g. for git: {\"repository_id\": 1, \"commits\": true, \"enrich\": {\"github\": {\"resources\": [\"issues\"]}}}",
		Tags:        tags, Metadata: access.Require(access.Researcher), DefaultStatus: http.StatusAccepted,
	}, func(ctx context.Context, in *struct {
		Body struct {
			Platform platform.ID     `json:"platform"`
			Params   json.RawMessage `json:"params,omitempty"`
		}
	}) (*collectionOutput, error) {
		p, _ := access.FromContext(ctx)
		c, err := s.Start(ctx, p.UserID, in.Body.Platform, in.Body.Params)
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
		OperationID: "cancel-collection", Method: http.MethodPost, Path: "/api/collections/{id}/cancel",
		Summary: "Cancel a running collection", Tags: tags,
		Metadata: access.Require(access.Researcher), DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *struct {
		ID int64 `path:"id"`
	}) (*struct{}, error) {
		return nil, httpapi.Error(s.Cancel(ctx, in.ID))
	})
}

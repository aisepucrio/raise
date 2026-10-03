package credential

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"raise/internal/access"
	"raise/internal/httpapi"
	"raise/internal/platform"
)

type PlatformInfo struct {
	ID              platform.ID               `json:"id"`
	CredentialKinds []platform.CredentialKind `json:"credential_kinds"`
	CanCollect      bool                      `json:"can_collect" doc:"Accepts collections via POST /api/collections"`
}

func (s *Service) RegisterRoutes(api huma.API) {
	tags := []string{"credentials"}

	huma.Register(api, huma.Operation{
		OperationID: "list-platforms", Method: http.MethodGet, Path: "/api/platforms",
		Summary: "List platforms and the credential kinds they accept", Tags: []string{"platforms"},
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []PlatformInfo }, error) {
		var out []PlatformInfo
		for _, p := range s.registry.All() {
			info := PlatformInfo{ID: p.ID(), CredentialKinds: []platform.CredentialKind{}}
			if c, ok := p.(platform.Credentialed); ok {
				info.CredentialKinds = c.CredentialKinds()
			}
			_, info.CanCollect = p.(platform.Source)
			out = append(out, info)
		}
		return &struct{ Body []PlatformInfo }{out}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-credentials", Method: http.MethodGet, Path: "/api/credentials",
		Summary: "List credentials (secrets are never returned)", Tags: tags,
		Metadata: access.Require(access.Researcher),
	}, func(ctx context.Context, in *struct {
		Platform string `query:"platform"`
	}) (*struct{ Body []View }, error) {
		var filter *platform.ID
		if in.Platform != "" {
			p := platform.ID(in.Platform)
			filter = &p
		}
		views, err := s.List(ctx, filter)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body []View }{views}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "add-credential", Method: http.MethodPost, Path: "/api/credentials",
		Summary: "Add a credential; it is tested immediately", Tags: tags,
		Metadata: access.Require(access.Admin), DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *struct {
		Body struct {
			Platform platform.ID       `json:"platform"`
			Kind     string            `json:"kind"`
			Label    string            `json:"label" minLength:"1" maxLength:"100"`
			Fields   map[string]string `json:"fields"`
		}
	}) (*struct{ Body View }, error) {
		p, _ := access.FromContext(ctx)
		v, err := s.Add(ctx, p.UserID, in.Body.Platform, in.Body.Kind, in.Body.Label, in.Body.Fields)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body View }{v}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "test-credential", Method: http.MethodPost, Path: "/api/credentials/{id}/test",
		Summary: "Re-test a credential against the platform API", Tags: tags,
		Metadata: access.Require(access.Admin),
	}, func(ctx context.Context, in *struct {
		ID int64 `path:"id"`
	}) (*struct{ Body View }, error) {
		v, err := s.Test(ctx, in.ID)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body View }{v}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "delete-credential", Method: http.MethodDelete, Path: "/api/credentials/{id}",
		Summary: "Delete a credential", Tags: tags,
		Metadata: access.Require(access.Admin), DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *struct {
		ID int64 `path:"id"`
	}) (*struct{}, error) {
		return nil, httpapi.Error(s.Delete(ctx, in.ID))
	})
}

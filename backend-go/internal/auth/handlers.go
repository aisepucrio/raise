package auth

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"raise/internal/access"
	"raise/internal/httpapi"
)

func principal(ctx context.Context) access.Principal {
	p, _ := access.FromContext(ctx) // RequireRole guarantees presence
	return p
}

type userOutput struct{ Body User }

func (s *Service) RegisterRoutes(api huma.API) {
	tags := []string{"auth"}

	huma.Register(api, huma.Operation{
		OperationID: "login", Method: http.MethodPost, Path: "/api/auth/login",
		Summary: "Log in with username and password", Tags: tags, Metadata: access.Public(),
	}, func(ctx context.Context, in *struct {
		Body struct {
			Username string `json:"username" minLength:"1"`
			Password string `json:"password" minLength:"1"`
		}
	}) (*userOutput, error) {
		if !s.limiter.Allow(httpapi.ClientIP(ctx) + "|" + strings.ToLower(in.Body.Username)) {
			return nil, huma.Error429TooManyRequests("too many login attempts, try again in a minute")
		}
		u, err := s.Authenticate(ctx, in.Body.Username, in.Body.Password)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		// New token on privilege change prevents session fixation.
		if err := s.sessions.RenewToken(ctx); err != nil {
			return nil, httpapi.Error(err)
		}
		s.sessions.Put(ctx, sessionUserKey, u.ID)
		return &userOutput{Body: u}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "logout", Method: http.MethodPost, Path: "/api/auth/logout",
		Summary: "End the current session", Tags: tags, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, _ *struct{}) (*struct{}, error) {
		return nil, httpapi.Error(s.sessions.Destroy(ctx))
	})

	huma.Register(api, huma.Operation{
		OperationID: "me", Method: http.MethodGet, Path: "/api/auth/me",
		Summary: "Current user", Tags: tags,
	}, func(ctx context.Context, _ *struct{}) (*userOutput, error) {
		u, err := s.GetUser(ctx, principal(ctx).UserID)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &userOutput{Body: u}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "change-password", Method: http.MethodPost, Path: "/api/auth/password",
		Summary: "Change own password", Tags: tags, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *struct {
		Body struct {
			CurrentPassword string `json:"current_password"`
			NewPassword     string `json:"new_password"`
		}
	}) (*struct{}, error) {
		if err := s.ChangePassword(ctx, principal(ctx).UserID, in.Body.CurrentPassword, in.Body.NewPassword); err != nil {
			return nil, httpapi.Error(err)
		}
		return nil, httpapi.Error(s.sessions.RenewToken(ctx))
	})

	s.registerAPIKeyRoutes(api)
	s.registerUserAdminRoutes(api)
}

func (s *Service) registerAPIKeyRoutes(api huma.API) {
	tags := []string{"auth"}

	huma.Register(api, huma.Operation{
		OperationID: "list-api-keys", Method: http.MethodGet, Path: "/api/auth/api-keys",
		Summary: "List own API keys", Tags: tags,
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []APIKey }, error) {
		keys, err := s.ListAPIKeys(ctx, principal(ctx).UserID)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body []APIKey }{keys}, nil
	})

	type createdKey struct {
		Key   APIKey `json:"key"`
		Token string `json:"token" doc:"Shown only once."`
	}
	huma.Register(api, huma.Operation{
		OperationID: "create-api-key", Method: http.MethodPost, Path: "/api/auth/api-keys",
		Summary: "Create an API key for scripted access", Tags: tags, DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *struct {
		Body struct {
			Label         string `json:"label" minLength:"1" maxLength:"100"`
			ExpiresInDays int    `json:"expires_in_days,omitempty" minimum:"0" doc:"0 means no expiry"`
		}
	}) (*struct{ Body createdKey }, error) {
		var expires *time.Time
		if d := in.Body.ExpiresInDays; d > 0 {
			t := time.Now().AddDate(0, 0, d)
			expires = &t
		}
		token, key, err := s.CreateAPIKey(ctx, principal(ctx).UserID, in.Body.Label, expires)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body createdKey }{createdKey{Key: key, Token: token}}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "revoke-api-key", Method: http.MethodDelete, Path: "/api/auth/api-keys/{id}",
		Summary: "Revoke an API key", Tags: tags, DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *struct {
		ID int64 `path:"id"`
	}) (*struct{}, error) {
		return nil, httpapi.Error(s.RevokeAPIKey(ctx, principal(ctx).UserID, in.ID))
	})
}

func (s *Service) registerUserAdminRoutes(api huma.API) {
	tags := []string{"users"}
	admin := access.Require(access.Admin)

	huma.Register(api, huma.Operation{
		OperationID: "list-users", Method: http.MethodGet, Path: "/api/users",
		Summary: "List users", Tags: tags, Metadata: admin,
	}, func(ctx context.Context, _ *struct{}) (*struct{ Body []User }, error) {
		users, err := s.ListUsers(ctx)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body []User }{users}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "create-user", Method: http.MethodPost, Path: "/api/users",
		Summary: "Create a user", Tags: tags, Metadata: admin, DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *struct {
		Body struct {
			Username string      `json:"username"`
			Password string      `json:"password"`
			Role     access.Role `json:"role" enum:"viewer,researcher,admin"`
		}
	}) (*userOutput, error) {
		u, err := s.CreateUser(ctx, in.Body.Username, in.Body.Password, in.Body.Role)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &userOutput{Body: u}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-user", Method: http.MethodPatch, Path: "/api/users/{id}",
		Summary: "Change a user's role, disable them, or reset their password", Tags: tags, Metadata: admin,
	}, func(ctx context.Context, in *struct {
		ID   int64 `path:"id"`
		Body struct {
			Role     *access.Role `json:"role,omitempty" enum:"viewer,researcher,admin"`
			Disabled *bool        `json:"disabled,omitempty"`
			Password *string      `json:"password,omitempty"`
		}
	}) (*userOutput, error) {
		if in.ID == principal(ctx).UserID && (in.Body.Role != nil || in.Body.Disabled != nil) {
			return nil, huma.Error422UnprocessableEntity("admins can't change their own role or disable themselves")
		}
		u, err := s.UpdateUser(ctx, in.ID, UserUpdate{Role: in.Body.Role, Disabled: in.Body.Disabled, Password: in.Body.Password})
		if err != nil {
			return nil, httpapi.Error(err)
		}
		return &userOutput{Body: u}, nil
	})
}

// Package httpapi holds the shared HTTP plumbing: router and huma setup,
// cross-cutting middleware and the mapping from domain errors to responses.
// It imports no domain packages; app wires domain middleware into it.
package httpapi

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"

	"raise/internal/access"
)

const (
	SessionCookie   = "raise_session"
	securitySession = "session"
	securityAPIKey  = "apiKey"
)

type Config struct {
	Title   string
	Version string
}

// New builds the router and huma API. Middleware must be supplied here because
// chi requires all middleware to be registered before any route.
func New(cfg Config, middleware ...func(http.Handler) http.Handler) (chi.Router, huma.API) {
	r := chi.NewRouter()
	r.Use(middleware...)

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	hc := huma.DefaultConfig(cfg.Title, cfg.Version)
	hc.OpenAPIPath = "/api/openapi"
	hc.DocsPath = "/api/docs"
	hc.SchemasPath = "/api/schemas"
	hc.Components.SecuritySchemes = map[string]*huma.SecurityScheme{
		securitySession: {Type: "apiKey", In: "cookie", Name: SessionCookie},
		securityAPIKey:  {Type: "http", Scheme: "bearer", Description: "Personal API key (rk_...)"},
	}
	// Security in the OpenAPI document is derived from the same metadata the
	// role middleware enforces, so the two can't drift apart.
	hc.OnAddOperation = append(hc.OnAddOperation, func(_ *huma.OpenAPI, op *huma.Operation) {
		if _, public := access.RequiredRole(op); !public {
			op.Security = []map[string][]string{{securitySession: {}}, {securityAPIKey: {}}}
		}
	})

	return r, humachi.New(r, hc)
}

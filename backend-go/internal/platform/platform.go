// Package platform defines the contracts every mining platform implements.
//
// A platform is a vertical slice: its API client, credential test, job args,
// workers, persistence and HTTP routes live in its own package. The rest of
// the application only talks to platforms through these interfaces, so adding
// a platform means adding a package and one line in app/registry.go.
//
// Capabilities are optional interfaces checked with type assertions:
//
//   - Credentialed: the platform uses API credentials managed by the
//     credential layer (and knows how to test them).
//   - Source: the platform can start a collection on its own (git, jira,
//     stackoverflow). Forges (github, gitlab) instead enrich git
//     repositories; see the Enricher interface in platform/git.
package platform

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"

	"raise/internal/jobkit"
)

type ID string

type Platform interface {
	ID() ID
	// RegisterWorkers adds the platform's River workers.
	RegisterWorkers(w *river.Workers)
	// Queues the platform's jobs run on, with their concurrency.
	Queues() map[string]river.QueueConfig
	// RegisterRoutes adds lookup/dashboard/export operations.
	RegisterRoutes(api huma.API)
}

type Credentialed interface {
	Platform
	CredentialKinds() []CredentialKind
	// TestCredential checks a credential against the live API. It returns an
	// error only for infrastructure failures; a rejected credential is a
	// TestResult with OK=false.
	TestCredential(ctx context.Context, c Credential) (TestResult, error)
}

type Source interface {
	Platform
	// StartCollection validates params and enqueues the root jobs of a
	// collection inside tx. Invalid params must wrap apperr.ErrInvalid.
	StartCollection(ctx context.Context, tx pgx.Tx, enq jobkit.Enqueuer, params json.RawMessage) error
}

// CredentialKind describes one type of credential a platform accepts. The
// frontend renders the "add credential" form from Fields.
type CredentialKind struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Fields      []Field `json:"fields"`
}

type Field struct {
	Name     string `json:"name"`
	Label    string `json:"label"`
	Secret   bool   `json:"secret"`
	Optional bool   `json:"optional,omitempty"`
}

// Credential is a decrypted credential, handed to platform code only.
type Credential struct {
	ID       int64
	Platform ID
	Kind     string
	Public   map[string]string
	Secret   map[string]string
}

// Field returns a public or secret field value.
func (c Credential) Field(name string) string {
	if v, ok := c.Secret[name]; ok {
		return v
	}
	return c.Public[name]
}

type Quota struct {
	Scope     string    `json:"scope"`
	Limit     int       `json:"limit"`
	Remaining int       `json:"remaining"`
	ResetAt   time.Time `json:"reset_at"`
}

type TestResult struct {
	OK       bool    `json:"ok"`
	Reason   string  `json:"reason,omitempty"`
	Identity string  `json:"identity,omitempty"`
	Quotas   []Quota `json:"quotas,omitempty"`
}

// Lease is a credential checked out of the pool for one or a few requests.
type Lease interface {
	Credential() Credential
	// Report records the quota observed in an API response.
	Report(ctx context.Context, q Quota) error
	// Invalidate takes the credential out of rotation (e.g. after a 401).
	Invalidate(ctx context.Context, reason string) error
}

// Leaser hands out credentials. Implemented by credential.Pool. When no
// credential has quota it returns *jobkit.RateLimitedError; when none exist it
// returns an error wrapping jobkit.ErrNoCredential.
type Leaser interface {
	Lease(ctx context.Context, platform ID, scope string) (Lease, error)
}

// Deps are the shared dependencies handed to every platform constructor.
type Deps struct {
	DB          *pgxpool.Pool
	Credentials Leaser
	HTTP        *http.Client
	Logger      *slog.Logger
}

// Package stackoverflow is a standalone source: it mines questions from the
// Stack Exchange API. Credential testing is implemented; collection jobs are
// not yet.
package stackoverflow

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"

	"raise/internal/apperr"
	"raise/internal/jobkit"
	"raise/internal/platform"
)

const ID platform.ID = "stackoverflow"

const apiBase = "https://api.stackexchange.com/2.3"

type Platform struct {
	deps platform.Deps
}

var (
	_ platform.Credentialed = (*Platform)(nil)
	_ platform.Source       = (*Platform)(nil)
)

func New(deps platform.Deps) *Platform { return &Platform{deps: deps} }

func (p *Platform) ID() platform.ID { return ID }

func (p *Platform) Queues() map[string]river.QueueConfig {
	return map[string]river.QueueConfig{"stackoverflow": {MaxWorkers: 10}}
}

func (p *Platform) RegisterWorkers(*river.Workers) {}
func (p *Platform) RegisterRoutes(huma.API)        {}

func (p *Platform) CredentialKinds() []platform.CredentialKind {
	return []platform.CredentialKind{{
		Name:        "app_key",
		Description: "Stack Apps key, optionally with an access token for a higher quota.",
		Fields: []platform.Field{
			{Name: "key", Label: "App key", Secret: true},
			{Name: "access_token", Label: "Access token", Secret: true, Optional: true},
		},
	}}
}

// TestCredential calls /info, whose response also reports the daily quota.
func (p *Platform) TestCredential(ctx context.Context, c platform.Credential) (platform.TestResult, error) {
	q := url.Values{"site": {"stackoverflow"}, "key": {c.Field("key")}}
	if t := c.Field("access_token"); t != "" {
		q.Set("access_token", t)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiBase+"/info?"+q.Encode(), nil)
	if err != nil {
		return platform.TestResult{}, err
	}
	resp, err := p.deps.HTTP.Do(req)
	if err != nil {
		return platform.TestResult{}, err
	}
	defer resp.Body.Close()
	var body struct {
		QuotaMax       int    `json:"quota_max"`
		QuotaRemaining int    `json:"quota_remaining"`
		ErrorName      string `json:"error_name"`
		ErrorMessage   string `json:"error_message"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return platform.TestResult{}, fmt.Errorf("unexpected response from Stack Exchange: %s", resp.Status)
	}
	if body.ErrorName != "" {
		return platform.TestResult{OK: false, Reason: body.ErrorName + ": " + body.ErrorMessage}, nil
	}
	// Quotas reset daily at midnight UTC.
	reset := time.Now().UTC().Truncate(24 * time.Hour).Add(24 * time.Hour)
	return platform.TestResult{
		OK:     true,
		Quotas: []platform.Quota{{Scope: "api", Limit: body.QuotaMax, Remaining: body.QuotaRemaining, ResetAt: reset}},
	}, nil
}

func (p *Platform) StartCollection(context.Context, pgx.Tx, jobkit.Enqueuer, json.RawMessage) error {
	return fmt.Errorf("%w: stackoverflow collections", apperr.ErrNotImplemented)
}

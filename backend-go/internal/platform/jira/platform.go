// Package jira is a standalone source: it mines issues of Jira Cloud
// projects. Credential testing is implemented; collection jobs are not yet.
package jira

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"

	"raise/internal/apperr"
	"raise/internal/jobkit"
	"raise/internal/platform"
)

const ID platform.ID = "jira"

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
	return map[string]river.QueueConfig{"jira": {MaxWorkers: 10}}
}

func (p *Platform) RegisterWorkers(*river.Workers) {}
func (p *Platform) RegisterRoutes(huma.API)        {}

func (p *Platform) CredentialKinds() []platform.CredentialKind {
	return []platform.CredentialKind{{
		Name:        "api_token",
		Description: "Atlassian account email plus an API token (id.atlassian.com → Security → API tokens).",
		Fields: []platform.Field{
			{Name: "base_url", Label: "Site URL, e.g. https://your-org.atlassian.net"},
			{Name: "email", Label: "Account email"},
			{Name: "token", Label: "API token", Secret: true},
		},
	}}
}

func (p *Platform) TestCredential(ctx context.Context, c platform.Credential) (platform.TestResult, error) {
	base := strings.TrimRight(c.Field("base_url"), "/")
	if !strings.HasPrefix(base, "https://") {
		return platform.TestResult{OK: false, Reason: "base_url must start with https://"}, nil
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base+"/rest/api/3/myself", nil)
	if err != nil {
		return platform.TestResult{}, err
	}
	req.SetBasicAuth(c.Field("email"), c.Field("token"))
	req.Header.Set("Accept", "application/json")
	resp, err := p.deps.HTTP.Do(req)
	if err != nil {
		return platform.TestResult{}, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
	case http.StatusUnauthorized, http.StatusForbidden:
		return platform.TestResult{OK: false, Reason: "email/token rejected by " + base}, nil
	case http.StatusNotFound:
		return platform.TestResult{OK: false, Reason: "no Jira site at " + base}, nil
	default:
		return platform.TestResult{}, fmt.Errorf("unexpected response from Jira: %s", resp.Status)
	}
	var me struct {
		DisplayName  string `json:"displayName"`
		EmailAddress string `json:"emailAddress"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&me); err != nil {
		return platform.TestResult{}, err
	}
	return platform.TestResult{OK: true, Identity: me.DisplayName}, nil
}

func (p *Platform) StartCollection(context.Context, pgx.Tx, jobkit.Enqueuer, json.RawMessage) error {
	return fmt.Errorf("%w: jira collections", apperr.ErrNotImplemented)
}

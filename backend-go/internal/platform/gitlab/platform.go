// Package gitlab is a forge for repositories hosted on GitLab (gitlab.com or
// self-managed). Credential testing and remote matching are implemented;
// enrichment jobs are not yet.
package gitlab

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"slices"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"

	"raise/internal/apperr"
	"raise/internal/jobkit"
	"raise/internal/platform"
	"raise/internal/platform/git"
)

const ID platform.ID = "gitlab"

type Config struct {
	Hosts []string
}

type Platform struct {
	cfg  Config
	deps platform.Deps
}

var (
	_ platform.Credentialed = (*Platform)(nil)
	_ git.Enricher          = (*Platform)(nil)
)

func New(deps platform.Deps, cfg Config) *Platform {
	if len(cfg.Hosts) == 0 {
		cfg.Hosts = []string{"gitlab.com"}
	}
	return &Platform{cfg: cfg, deps: deps}
}

func (p *Platform) ID() platform.ID                      { return ID }
func (p *Platform) Queues() map[string]river.QueueConfig { return nil }
func (p *Platform) RegisterWorkers(*river.Workers)       {}
func (p *Platform) RegisterRoutes(huma.API)              {}

func (p *Platform) CredentialKinds() []platform.CredentialKind {
	return []platform.CredentialKind{{
		Name:        "personal_access_token",
		Description: "Personal access token with read_api and read_repository scopes.",
		Fields: []platform.Field{
			{Name: "base_url", Label: "GitLab URL (default https://gitlab.com)", Optional: true},
			{Name: "token", Label: "Token", Secret: true},
		},
	}}
}

func baseURL(c platform.Credential) string {
	if u := c.Field("base_url"); u != "" {
		return strings.TrimRight(u, "/")
	}
	return "https://gitlab.com"
}

func (p *Platform) TestCredential(ctx context.Context, c platform.Credential) (platform.TestResult, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL(c)+"/api/v4/user", nil)
	if err != nil {
		return platform.TestResult{}, err
	}
	req.Header.Set("PRIVATE-TOKEN", c.Field("token"))
	resp, err := p.deps.HTTP.Do(req)
	if err != nil {
		return platform.TestResult{}, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
	case http.StatusUnauthorized:
		return platform.TestResult{OK: false, Reason: "invalid, expired or revoked token"}, nil
	case http.StatusForbidden:
		return platform.TestResult{OK: false, Reason: "token lacks the read_api scope"}, nil
	default:
		return platform.TestResult{}, fmt.Errorf("unexpected response from GitLab: %s", resp.Status)
	}
	var user struct {
		Username string `json:"username"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return platform.TestResult{}, err
	}
	return platform.TestResult{OK: true, Identity: user.Username}, nil
}

// MatchRemote accepts nested groups: the last path segment is the project
// name and everything before it the namespace.
func (p *Platform) MatchRemote(host, path string) (git.RepoRef, bool) {
	if !slices.Contains(p.cfg.Hosts, host) {
		return git.RepoRef{}, false
	}
	i := strings.LastIndex(path, "/")
	if i <= 0 || i == len(path)-1 {
		return git.RepoRef{}, false
	}
	return git.RepoRef{Platform: ID, Owner: path[:i], Name: path[i+1:]}, true
}

// CloneAuth uses any active GitLab credential.
// TODO: scope credentials by host once self-managed instances are in use.
func (p *Platform) CloneAuth(ctx context.Context, _ git.RepoRef) (*git.CloneAuth, error) {
	lease, err := p.deps.Credentials.Lease(ctx, ID, "api")
	if err != nil {
		return nil, err
	}
	return &git.CloneAuth{Username: "oauth2", Password: lease.Credential().Field("token")}, nil
}

func (p *Platform) StartEnrichment(context.Context, pgx.Tx, jobkit.Enqueuer, git.Repository, git.RepoRef, git.EnrichRequest) error {
	return fmt.Errorf("%w: gitlab enrichment", apperr.ErrNotImplemented)
}

func (p *Platform) OnCommitsMined(git.Repository, git.RepoRef, git.EnrichRequest, []string) []river.InsertManyParams {
	return nil
}

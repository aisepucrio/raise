package app

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"raise/internal/credential"
	"raise/internal/platform"
	"raise/internal/platform/git"
	"raise/internal/platform/github"
	"raise/internal/platform/gitlab"
	"raise/internal/platform/jira"
	"raise/internal/platform/stackoverflow"
)

// buildRegistry constructs every platform. Forges are built first and handed
// to git as enrichers; adding a platform means adding it here.
func buildRegistry(cfg Config, pool *pgxpool.Pool, keys *credential.Keyring, logger *slog.Logger) (*platform.Registry, error) {
	deps := platform.Deps{
		DB:          pool,
		Credentials: credential.NewPool(pool, keys),
		HTTP:        &http.Client{Timeout: 60 * time.Second},
		Logger:      logger,
	}

	gh := github.New(deps, github.Config{
		APIURL:      cfg.GitHubAPIURL,
		Hosts:       cfg.GitHubHosts,
		Concurrency: cfg.GitHubConcurrency,
	})
	gl := gitlab.New(deps, gitlab.Config{Hosts: cfg.GitLabHosts})

	g := git.New(deps, git.Config{
		MirrorDir:   cfg.GitMirrorDir,
		GitBinary:   cfg.GitBinary,
		BatchSize:   cfg.GitCommitBatchSize,
		Concurrency: cfg.GitConcurrency,
	}, gh, gl)

	return platform.NewRegistry(g, gh, gl, jira.New(deps), stackoverflow.New(deps))
}

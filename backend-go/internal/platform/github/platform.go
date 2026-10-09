// Package github is a forge: it enriches git repositories hosted on GitHub
// with repository metadata, issues, pull requests and commit data from the
// GraphQL API.
package github

import (
	"github.com/danielgtaylor/huma/v2"
	"github.com/riverqueue/river"

	"raise/internal/platform"
	"raise/internal/platform/git"
	"raise/internal/platform/github/sqlc"
)

const ID platform.ID = "github"

type Config struct {
	// REST base URL, used for credential tests.
	APIURL string
	// GraphQL endpoint, used for mining. Derived from APIURL when empty.
	GraphQLURL string
	// Hosts whose repositories this forge recognises (GitHub Enterprise
	// installations can be added here together with their APIURL).
	Hosts       []string
	Concurrency int
}

type Platform struct {
	cfg    Config
	deps   platform.Deps
	q      *sqlc.Queries
	client *Client
}

var (
	_ platform.Credentialed = (*Platform)(nil)
	_ git.Enricher          = (*Platform)(nil)
)

func New(deps platform.Deps, cfg Config) *Platform {
	if cfg.APIURL == "" {
		cfg.APIURL = "https://api.github.com"
	}
	if cfg.GraphQLURL == "" {
		cfg.GraphQLURL = graphqlURLFor(cfg.APIURL)
	}
	if len(cfg.Hosts) == 0 {
		cfg.Hosts = []string{"github.com"}
	}
	if cfg.Concurrency <= 0 {
		cfg.Concurrency = 20
	}
	return &Platform{
		cfg:    cfg,
		deps:   deps,
		q:      sqlc.New(deps.DB),
		client: NewClient(deps.HTTP, cfg.APIURL, cfg.GraphQLURL, deps.Credentials),
	}
}

func (p *Platform) ID() platform.ID { return ID }

func (p *Platform) Queues() map[string]river.QueueConfig {
	return map[string]river.QueueConfig{queue: {MaxWorkers: p.cfg.Concurrency}}
}

func (p *Platform) RegisterWorkers(w *river.Workers) {
	river.AddWorker(w, &fetchRepositoryWorker{p: p})
	river.AddWorker(w, &listIssuesWorker{p: p})
	river.AddWorker(w, &fetchIssuesWorker{p: p})
	river.AddWorker(w, &listPullRequestsWorker{p: p})
	river.AddWorker(w, &fetchPullRequestsWorker{p: p})
	river.AddWorker(w, &fetchConnectionWorker{p: p})
	river.AddWorker(w, &planCommitsWorker{p: p})
	river.AddWorker(w, &fetchCommitsWorker{p: p})
}

func (p *Platform) RegisterRoutes(api huma.API) { p.registerRoutes(api) }

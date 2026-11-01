// Package git is the base platform for repository mining. It owns the
// repository concept and mines commit history locally from bare mirrors.
// Forges (github, gitlab) implement Enricher to add platform data on top.
package git

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"runtime"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"

	"raise/internal/apperr"
	"raise/internal/jobkit"
	"raise/internal/platform"
	"raise/internal/platform/git/sqlc"
)

const ID platform.ID = "git"

type Config struct {
	MirrorDir string
	GitBinary string
	// BatchSize is the number of commits mined per MineCommitBatch job.
	BatchSize int
	// Concurrency is the number of git jobs run in parallel per worker
	// process. Mining is CPU and disk bound; defaults to the number of CPUs.
	Concurrency int
}

type Platform struct {
	cfg       Config
	deps      platform.Deps
	q         *sqlc.Queries
	mirrors   *Mirrors
	enrichers map[platform.ID]Enricher
	order     []Enricher
}

var (
	_ platform.Source    = (*Platform)(nil)
	_ platform.Scheduler = (*Platform)(nil)
)

func New(deps platform.Deps, cfg Config, enrichers ...Enricher) *Platform {
	if cfg.GitBinary == "" {
		cfg.GitBinary = "git"
	}
	if cfg.BatchSize <= 0 {
		cfg.BatchSize = 500
	}
	if cfg.Concurrency <= 0 {
		cfg.Concurrency = runtime.NumCPU()
	}
	p := &Platform{
		cfg:       cfg,
		deps:      deps,
		q:         sqlc.New(deps.DB),
		mirrors:   NewMirrors(cfg.MirrorDir, cfg.GitBinary, deps.DB),
		enrichers: map[platform.ID]Enricher{},
		order:     enrichers,
	}
	for _, e := range enrichers {
		p.enrichers[e.ID()] = e
	}
	return p
}

func (p *Platform) ID() platform.ID { return ID }

func (p *Platform) Queues() map[string]river.QueueConfig {
	return map[string]river.QueueConfig{queue: {MaxWorkers: p.cfg.Concurrency}}
}

func (p *Platform) RegisterWorkers(w *river.Workers) {
	river.AddWorker(w, &syncMirrorWorker{p: p})
	river.AddWorker(w, &planCommitsWorker{p: p})
	river.AddWorker(w, &mineCommitBatchWorker{p: p})
	river.AddWorker(w, &mineDiffBatchWorker{p: p})
	river.AddWorker(w, &pruneMirrorsWorker{p: p})
}

// pruneInterval is how long a deleted repository's mirror may stay on disk.
const pruneInterval = 15 * time.Minute

func (p *Platform) PeriodicJobs() []*river.PeriodicJob {
	return []*river.PeriodicJob{river.NewPeriodicJob(
		river.PeriodicInterval(pruneInterval),
		func() (river.JobArgs, *river.InsertOpts) { return PruneMirrorsArgs{}, nil },
		&river.PeriodicJobOpts{RunOnStart: true},
	)}
}

func (p *Platform) RegisterRoutes(api huma.API) { p.registerRoutes(api) }

// CollectParams are the params of a git collection. A collection covers one
// or more repositories, given by ID or by URL in any combination, and does
// the same for each.
type CollectParams struct {
	RepositoryID  int64    `json:"repository_id,omitempty"`
	RepositoryIDs []int64  `json:"repository_ids,omitempty"`
	URL           string   `json:"url,omitempty" doc:"Alternative to repository_id; registers the repository if needed"`
	URLs          []string `json:"urls,omitempty" doc:"Alternative to repository_ids; registers the repositories if needed"`
	// Commits mines the commit history from the local mirror.
	Commits bool `json:"commits"`
	// Diffs also mines each commit file's text diff, for the commits mined
	// now and those mined before without it. It needs commits.
	Diffs bool `json:"diffs,omitempty" doc:"Also mine each changed file's diff (commit_file_diffs). Needs commits: true"`
	// Enrich requests forge data, keyed by forge (e.g. "github").
	Enrich map[platform.ID]EnrichRequest `json:"enrich,omitempty"`
}

// maxCollectionRepositories bounds a collection, whose root jobs are all
// enqueued in the request's transaction.
const maxCollectionRepositories = 1000

func (p *Platform) StartCollection(ctx context.Context, tx pgx.Tx, enq jobkit.Enqueuer, raw json.RawMessage) error {
	var params CollectParams
	dec := json.NewDecoder(bytes.NewReader(raw))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&params); err != nil {
		return fmt.Errorf("%w: %v", apperr.ErrInvalid, err)
	}
	if params.Diffs && !params.Commits {
		return fmt.Errorf("%w: diffs are mined with the commits: set commits too", apperr.ErrInvalid)
	}
	if !params.Commits && len(params.Enrich) == 0 {
		return fmt.Errorf("%w: nothing to collect: set commits and/or enrich", apperr.ErrInvalid)
	}

	for forge, req := range params.Enrich {
		if _, ok := p.enrichers[forge]; !ok {
			return fmt.Errorf("%w: %q is not a forge", apperr.ErrInvalid, forge)
		}
		if req.CreatedSince != nil && req.CreatedUntil != nil && !req.CreatedSince.Before(*req.CreatedUntil) {
			return fmt.Errorf("%w: %s: created_since must be before created_until", apperr.ErrInvalid, forge)
		}
	}

	repos, err := p.collectionRepositories(ctx, p.q.WithTx(tx), params)
	if err != nil {
		return err
	}
	for _, repo := range repos {
		if err := p.startRepository(ctx, tx, enq, repo, params); err != nil {
			return err
		}
	}
	return nil
}

// collectionRepositories resolves and registers the collection's
// repositories, in the order given and without duplicates.
func (p *Platform) collectionRepositories(ctx context.Context, q *sqlc.Queries, params CollectParams) ([]Repository, error) {
	ids := params.RepositoryIDs
	if params.RepositoryID != 0 {
		ids = append([]int64{params.RepositoryID}, ids...)
	}
	urls := params.URLs
	if params.URL != "" {
		urls = append([]string{params.URL}, urls...)
	}
	if len(ids) == 0 && len(urls) == 0 {
		return nil, fmt.Errorf("%w: repository_id, repository_ids, url or urls is required", apperr.ErrInvalid)
	}
	if n := len(ids) + len(urls); n > maxCollectionRepositories {
		return nil, fmt.Errorf("%w: %d repositories, more than %d per collection", apperr.ErrInvalid, n, maxCollectionRepositories)
	}

	var repos []Repository
	seen := map[int64]bool{}
	add := func(repo Repository, err error) error {
		if err != nil {
			return err
		}
		if !seen[repo.ID] {
			seen[repo.ID] = true
			repos = append(repos, repo)
		}
		return nil
	}
	for _, id := range ids {
		if err := add(p.getRepository(ctx, q, id)); err != nil {
			return nil, err
		}
	}
	for _, u := range urls {
		if err := add(p.register(ctx, q, u)); err != nil {
			return nil, err
		}
	}
	return repos, nil
}

// startRepository enqueues the root jobs for one repository of a collection.
func (p *Platform) startRepository(ctx context.Context, tx pgx.Tx, enq jobkit.Enqueuer, repo Repository, params CollectParams) error {
	if params.Commits {
		if _, err := enq.Enqueue(ctx, tx, jobkit.Job(SyncMirrorArgs{RepositoryID: repo.ID, Enrich: params.Enrich, Diffs: params.Diffs})); err != nil {
			return err
		}
	}
	for forge, req := range params.Enrich {
		ref, ok := repo.Remote(forge)
		if !ok {
			return fmt.Errorf("%w: repository %s is not hosted on %s", apperr.ErrInvalid, repo.URL, forge)
		}
		if err := p.enrichers[forge].StartEnrichment(ctx, tx, enq, repo, ref, req); err != nil {
			return err
		}
	}
	return nil
}

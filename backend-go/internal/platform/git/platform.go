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

var _ platform.Source = (*Platform)(nil)

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
}

func (p *Platform) RegisterRoutes(api huma.API) { p.registerRoutes(api) }

// CollectParams are the params of a git collection.
type CollectParams struct {
	RepositoryID int64  `json:"repository_id,omitempty"`
	URL          string `json:"url,omitempty" doc:"Alternative to repository_id; registers the repository if needed"`
	// Commits mines the commit history from the local mirror.
	Commits bool `json:"commits"`
	// Enrich requests forge data, keyed by forge (e.g. "github").
	Enrich map[platform.ID]EnrichRequest `json:"enrich,omitempty"`
}

func (p *Platform) StartCollection(ctx context.Context, tx pgx.Tx, enq jobkit.Enqueuer, raw json.RawMessage) error {
	var params CollectParams
	dec := json.NewDecoder(bytes.NewReader(raw))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&params); err != nil {
		return fmt.Errorf("%w: %v", apperr.ErrInvalid, err)
	}
	if !params.Commits && len(params.Enrich) == 0 {
		return fmt.Errorf("%w: nothing to collect: set commits and/or enrich", apperr.ErrInvalid)
	}

	q := p.q.WithTx(tx)
	var repo Repository
	var err error
	switch {
	case params.RepositoryID != 0:
		repo, err = p.getRepository(ctx, q, params.RepositoryID)
	case params.URL != "":
		repo, err = p.register(ctx, q, params.URL)
	default:
		err = fmt.Errorf("%w: repository_id or url is required", apperr.ErrInvalid)
	}
	if err != nil {
		return err
	}

	if params.Commits {
		if _, err := enq.Enqueue(ctx, tx, jobkit.Job(SyncMirrorArgs{RepositoryID: repo.ID, Enrich: params.Enrich})); err != nil {
			return err
		}
	}
	for forge, req := range params.Enrich {
		e, ok := p.enrichers[forge]
		if !ok {
			return fmt.Errorf("%w: %q is not a forge", apperr.ErrInvalid, forge)
		}
		ref, ok := repo.Remote(forge)
		if !ok {
			return fmt.Errorf("%w: repository %s is not hosted on %s", apperr.ErrInvalid, repo.URL, forge)
		}
		if err := e.StartEnrichment(ctx, tx, enq, repo, ref, req); err != nil {
			return err
		}
	}
	return nil
}

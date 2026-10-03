package app

import (
	"context"
	"fmt"
	"maps"
	"slices"
	"time"

	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
	"github.com/riverqueue/river/rivertype"

	"raise/internal/collection"
	"raise/internal/credential"
	"raise/internal/db"
	"raise/internal/jobkit"
)

type WorkerOptions struct {
	// Queues restricts this process to a subset of queues (all if empty),
	// e.g. to run git mining on a host with the mirror volume.
	Queues []string
}

// RunWorker works jobs until ctx is cancelled, then drains gracefully.
func RunWorker(ctx context.Context, cfg Config, opts WorkerOptions) error {
	logger := NewLogger(cfg.LogLevel)

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	keys, err := credential.ParseKeyring(cfg.EncryptionKeys)
	if err != nil {
		return err
	}
	registry, err := buildRegistry(cfg, pool, keys, logger)
	if err != nil {
		return err
	}

	workers := river.NewWorkers()
	queues := map[string]river.QueueConfig{river.QueueDefault: {MaxWorkers: 5}}
	river.AddWorker(workers, collection.NewReconcileWorker(pool))
	for _, p := range registry.All() {
		p.RegisterWorkers(workers)
		maps.Copy(queues, p.Queues())
	}
	if len(opts.Queues) > 0 {
		for name := range queues {
			if !slices.Contains(opts.Queues, name) {
				delete(queues, name)
			}
		}
		if len(queues) == 0 {
			return fmt.Errorf("none of the queues %v exist", opts.Queues)
		}
	}

	client, err := river.NewClient(riverpgxv5.New(pool), &river.Config{
		Logger:       logger,
		Queues:       queues,
		Workers:      workers,
		Middleware:   []rivertype.Middleware{jobkit.NewMiddleware(pool, logger)},
		PeriodicJobs: []*river.PeriodicJob{collection.PeriodicJob()},
	})
	if err != nil {
		return err
	}
	if err := client.Start(ctx); err != nil {
		return err
	}
	logger.Info("worker started", "queues", slices.Sorted(maps.Keys(queues)))

	<-ctx.Done()
	stopCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := client.Stop(stopCtx); err != nil {
		logger.Warn("graceful stop timed out, cancelling running jobs", "error", err)
		return client.StopAndCancel(context.Background())
	}
	return nil
}

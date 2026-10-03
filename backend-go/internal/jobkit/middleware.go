package jobkit

import (
	"context"
	"log/slog"
	"math/rand/v2"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/rivertype"

	"raise/internal/jobkit/sqlc"
)

// Middleware is the worker middleware installed on every job. It maps domain
// errors to River outcomes (snooze/cancel), records collection progress, and
// logs each attempt.
type Middleware struct {
	river.WorkerMiddlewareDefaults
	pool   *pgxpool.Pool
	logger *slog.Logger
}

func NewMiddleware(pool *pgxpool.Pool, logger *slog.Logger) *Middleware {
	return &Middleware{pool: pool, logger: logger}
}

func (m *Middleware) Work(ctx context.Context, job *rivertype.JobRow, doInner func(context.Context) error) error {
	start := time.Now()
	err := MapError(doInner(ctx))

	log := m.logger.With("job_id", job.ID, "kind", job.Kind, "attempt", job.Attempt, "duration", time.Since(start))
	var done, failed int64
	switch {
	case err == nil:
		done = 1
		log.Debug("job completed")
	case isSnooze(err):
		log.Info("job snoozed", "reason", err)
	case isCancel(err) || job.Attempt >= job.MaxAttempts:
		failed = 1
		log.Error("job failed permanently", "error", err)
	default:
		log.Warn("job failed, will retry", "error", err)
	}

	if id := CollectionID(job); id != 0 && done+failed > 0 {
		perr := sqlc.New(m.pool).AddProgress(ctx, sqlc.AddProgressParams{
			CollectionID: id,
			Shard:        int16(rand.IntN(progressShards)),
			Done:         done,
			Failed:       failed,
		})
		if perr != nil {
			// Progress is best-effort; never fail a job because of it.
			log.Error("record progress", "error", perr)
		}
	}
	return err
}

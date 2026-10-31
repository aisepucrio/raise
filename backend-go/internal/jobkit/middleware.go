package jobkit

import (
	"context"
	"log/slog"
	"math/rand/v2"
	"time"
	"unicode/utf8"

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
	jobErr := doInner(ctx)
	err := MapError(jobErr)

	log := m.logger.With("job_id", job.ID, "kind", job.Kind, "attempt", job.Attempt, "duration", time.Since(start))
	var done, failed int64
	var failedAttempt bool
	switch {
	case err == nil:
		done = 1
		log.Debug("job completed")
	case isSnooze(err):
		log.Info("job snoozed", "reason", err)
	case isCancel(err) || job.Attempt >= job.MaxAttempts:
		failed, failedAttempt = 1, true
		log.Error("job failed permanently", "error", err)
	default:
		failedAttempt = true
		log.Warn("job failed, will retry", "error", err)
	}

	// Failed attempts (not snoozes, which are routine rate limiting) go to the
	// collection's log, which outlives River's job retention.
	if id := CollectionID(job); id != 0 && failedAttempt {
		lerr := sqlc.New(m.pool).AddJobError(ctx, sqlc.AddJobErrorParams{
			CollectionID: id,
			JobID:        job.ID,
			JobKind:      job.Kind,
			JobArgs:      job.EncodedArgs,
			Attempt:      int32(job.Attempt),
			IsFinal:      failed == 1,
			Error:        truncateError(jobErr, maxErrorLength),
		})
		if lerr != nil {
			// Like progress, the log is best-effort.
			log.Error("record job error", "error", lerr)
		}
	}

	if id := CollectionID(job); id != 0 && done+failed > 0 {
		perr := sqlc.New(m.pool).AddProgress(ctx, sqlc.AddProgressParams{
			CollectionID: id,
			Shard:        int16(rand.IntN(progressShards)),
			JobsDone:     done,
			JobsFailed:   failed,
		})
		if perr != nil {
			// Progress is best-effort; never fail a job because of it.
			log.Error("record progress", "error", perr)
		}
	}
	return err
}

// maxErrorLength bounds a logged error message, in bytes.
const maxErrorLength = 4000

// truncateError returns err's message, cut to at most n bytes on a rune
// boundary.
func truncateError(err error, n int) string {
	msg := err.Error()
	if len(msg) <= n {
		return msg
	}
	cut := n
	for cut > 0 && !utf8.RuneStart(msg[cut]) {
		cut--
	}
	return msg[:cut] + " …"
}

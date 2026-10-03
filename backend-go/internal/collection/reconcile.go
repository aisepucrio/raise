package collection

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"

	"raise/internal/collection/sqlc"
)

// ReconcileArgs is a periodic job that finishes collections whose jobs have
// all settled. Doing this periodically (rather than in the last job) avoids
// races where two concurrently finishing jobs each think the other is pending.
type ReconcileArgs struct{}

func (ReconcileArgs) Kind() string { return "collection.reconcile" }

func (ReconcileArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{UniqueOpts: river.UniqueOpts{ByPeriod: ReconcileInterval}}
}

const ReconcileInterval = 15 * time.Second

type ReconcileWorker struct {
	river.WorkerDefaults[ReconcileArgs]
	q *sqlc.Queries
}

func NewReconcileWorker(pool *pgxpool.Pool) *ReconcileWorker {
	return &ReconcileWorker{q: sqlc.New(pool)}
}

func (w *ReconcileWorker) Work(ctx context.Context, _ *river.Job[ReconcileArgs]) error {
	_, err := w.q.FinishSettledCollections(ctx)
	return err
}

// PeriodicJob schedules the reconciler.
func PeriodicJob() *river.PeriodicJob {
	return river.NewPeriodicJob(
		river.PeriodicInterval(ReconcileInterval),
		func() (river.JobArgs, *river.InsertOpts) { return ReconcileArgs{}, nil },
		&river.PeriodicJobOpts{RunOnStart: true},
	)
}

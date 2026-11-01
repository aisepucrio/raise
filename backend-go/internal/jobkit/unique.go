package jobkit

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/rivertype"
)

// UniqueInFlight deduplicates jobs with identical args while one is queued or
// running, but allows the same work to run again once it has completed (River's
// default would block re-runs until completed jobs are cleaned up).
func UniqueInFlight() river.UniqueOpts {
	return river.UniqueOpts{
		ByArgs: true,
		ByState: []rivertype.JobState{
			rivertype.JobStateAvailable,
			rivertype.JobStatePending,
			rivertype.JobStateRetryable,
			rivertype.JobStateRunning,
			rivertype.JobStateScheduled,
		},
	}
}

// UnfinishedJobs counts the jobs, in any queue, that are queued or running
// and whose args contain args (JSON containment), e.g. every job of one
// repository with {"repository_id": 7}. Data that such jobs are writing
// shouldn't be deleted under them. River's tables aren't in the migrations
// sqlc reads, so this query is written here.
func UnfinishedJobs(ctx context.Context, db interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}, args map[string]any) (int64, error) {
	filter, err := json.Marshal(args)
	if err != nil {
		return 0, err
	}
	var n int64
	err = db.QueryRow(ctx, `SELECT count(*) FROM river_job
		WHERE state IN ('available', 'pending', 'retryable', 'running', 'scheduled') AND args @> $1::jsonb`,
		filter).Scan(&n)
	return n, err
}

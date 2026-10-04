// Package collection is the user-facing unit of work: "mine X". A collection
// starts one or more root jobs through a platform.Source; every job fanned out
// from them carries the collection id, which is how progress is tracked.
package collection

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/rivertype"

	"raise/internal/apperr"
	"raise/internal/collection/sqlc"
	"raise/internal/jobkit"
	"raise/internal/platform"
)

type Collection struct {
	ID         int64           `json:"id"`
	Platform   platform.ID     `json:"platform"`
	Parameters json.RawMessage `json:"parameters"`
	Status     string          `json:"status" enum:"running,completed,partial,canceled"`
	CreatedBy  *int64          `json:"created_by,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
	FinishedAt *time.Time      `json:"finished_at,omitempty"`
	Progress   Progress        `json:"progress"`
}

type Progress struct {
	JobsExpected int64 `json:"jobs_expected" doc:"Jobs enqueued so far (grows as jobs fan out)"`
	JobsDone     int64 `json:"jobs_done"`
	JobsFailed   int64 `json:"jobs_failed"`
}

type Service struct {
	pool     *pgxpool.Pool
	q        *sqlc.Queries
	client   *jobkit.Client
	registry *platform.Registry
}

func NewService(pool *pgxpool.Pool, client *jobkit.Client, registry *platform.Registry) *Service {
	return &Service{pool: pool, q: sqlc.New(pool), client: client, registry: registry}
}

// Start creates the collection and enqueues its root jobs in one transaction,
// so a collection never exists without its jobs (or vice versa).
func (s *Service) Start(ctx context.Context, createdBy int64, pid platform.ID, parameters json.RawMessage) (Collection, error) {
	src, ok := s.registry.Source(pid)
	if !ok {
		return Collection{}, fmt.Errorf("%w: platform %q can't start collections", apperr.ErrInvalid, pid)
	}
	if len(parameters) == 0 {
		parameters = json.RawMessage("{}")
	}
	var id int64
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		c, err := s.q.WithTx(tx).CreateCollection(ctx, sqlc.CreateCollectionParams{
			Platform: string(pid), Parameters: parameters, CreatedBy: &createdBy,
		})
		if err != nil {
			return err
		}
		id = c.ID
		return src.StartCollection(ctx, tx, jobkit.NewEnqueuer(s.client, c.ID), parameters)
	})
	if err != nil {
		return Collection{}, err
	}
	return s.Get(ctx, id)
}

func (s *Service) Get(ctx context.Context, id int64) (Collection, error) {
	r, err := s.q.GetCollection(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return Collection{}, fmt.Errorf("%w: collection %d", apperr.ErrNotFound, id)
	}
	if err != nil {
		return Collection{}, err
	}
	return Collection{
		ID: r.ID, Platform: platform.ID(r.Platform), Parameters: r.Parameters, Status: r.Status,
		CreatedBy: r.CreatedBy, CreatedAt: r.CreatedAt, FinishedAt: r.FinishedAt,
		Progress: Progress{JobsExpected: r.JobsExpected, JobsDone: r.JobsDone, JobsFailed: r.JobsFailed},
	}, nil
}

func (s *Service) List(ctx context.Context, limit, offset int32) ([]Collection, error) {
	rows, err := s.q.ListCollections(ctx, sqlc.ListCollectionsParams{Limit: limit, Offset: offset})
	if err != nil {
		return nil, err
	}
	out := make([]Collection, len(rows))
	for i, r := range rows {
		out[i] = Collection{
			ID: r.ID, Platform: platform.ID(r.Platform), Parameters: r.Parameters, Status: r.Status,
			CreatedBy: r.CreatedBy, CreatedAt: r.CreatedAt, FinishedAt: r.FinishedAt,
			Progress: Progress{JobsExpected: r.JobsExpected, JobsDone: r.JobsDone, JobsFailed: r.JobsFailed},
		}
	}
	return out, nil
}

// Cancel marks the collection canceled and cancels its unfinished jobs. Jobs
// already running finish their current unit of work.
func (s *Service) Cancel(ctx context.Context, id int64) error {
	n, err := s.q.CancelCollection(ctx, id)
	if err != nil {
		return err
	}
	if n == 0 {
		if _, err := s.Get(ctx, id); err != nil {
			return err
		}
		return fmt.Errorf("%w: collection %d is not running", apperr.ErrConflict, id)
	}

	filter := fmt.Sprintf(`{"collection_id": %d}`, id)
	params := river.NewJobListParams().
		Metadata(filter).
		States(rivertype.JobStateAvailable, rivertype.JobStateScheduled, rivertype.JobStateRetryable, rivertype.JobStatePending).
		First(1000)
	for {
		res, err := s.client.JobList(ctx, params)
		if err != nil {
			return err
		}
		for _, j := range res.Jobs {
			if _, err := s.client.JobCancel(ctx, j.ID); err != nil {
				return err
			}
		}
		if len(res.Jobs) == 0 || res.LastCursor == nil {
			return nil
		}
		params = params.After(res.LastCursor)
	}
}

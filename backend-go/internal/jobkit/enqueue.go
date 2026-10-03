package jobkit

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand/v2"

	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/rivertype"

	"raise/internal/jobkit/sqlc"
)

const (
	metaCollectionID = "collection_id"
	progressShards   = 16
)

// Client is the River client type used throughout the app.
type Client = river.Client[pgx.Tx]

// Enqueuer inserts jobs on behalf of a collection. Every job it inserts carries
// the collection id in its metadata and is counted in the collection's
// expected total, so progress can be tracked across arbitrarily deep fan-outs.
type Enqueuer struct {
	client       *Client
	collectionID int64
}

func NewEnqueuer(client *Client, collectionID int64) Enqueuer {
	return Enqueuer{client: client, collectionID: collectionID}
}

// FromJob returns an Enqueuer that inherits the collection of the job being
// worked. Use it inside workers to fan out follow-up jobs.
func FromJob(ctx context.Context, job *rivertype.JobRow) Enqueuer {
	return Enqueuer{client: river.ClientFromContext[pgx.Tx](ctx), collectionID: CollectionID(job)}
}

func (e Enqueuer) CollectionID() int64 { return e.collectionID }

// Enqueue inserts jobs in tx. Jobs skipped as unique duplicates are not counted.
// Returns the number of jobs actually inserted.
func (e Enqueuer) Enqueue(ctx context.Context, tx pgx.Tx, params ...river.InsertManyParams) (int, error) {
	if len(params) == 0 {
		return 0, nil
	}
	if e.collectionID != 0 {
		for i := range params {
			opts := river.InsertOpts{}
			if params[i].InsertOpts != nil {
				opts = *params[i].InsertOpts
			}
			md, err := withCollection(opts.Metadata, e.collectionID)
			if err != nil {
				return 0, err
			}
			opts.Metadata = md
			params[i].InsertOpts = &opts
		}
	}

	results, err := e.client.InsertManyTx(ctx, tx, params)
	if err != nil {
		return 0, fmt.Errorf("insert jobs: %w", err)
	}
	inserted := 0
	for _, r := range results {
		if !r.UniqueSkippedAsDuplicate {
			inserted++
		}
	}
	if e.collectionID != 0 && inserted > 0 {
		err := sqlc.New(tx).AddProgress(ctx, sqlc.AddProgressParams{
			CollectionID: e.collectionID,
			Shard:        int16(rand.IntN(progressShards)),
			Expected:     int64(inserted),
		})
		if err != nil {
			return 0, fmt.Errorf("record expected jobs: %w", err)
		}
	}
	return inserted, nil
}

// Job is shorthand for river.InsertManyParams{Args: args}.
func Job(args river.JobArgs) river.InsertManyParams {
	return river.InsertManyParams{Args: args}
}

// CollectionID reads the collection a job belongs to (0 if none).
func CollectionID(job *rivertype.JobRow) int64 {
	var md struct {
		CollectionID int64 `json:"collection_id"`
	}
	_ = json.Unmarshal(job.Metadata, &md)
	return md.CollectionID
}

func withCollection(metadata []byte, id int64) ([]byte, error) {
	m := map[string]any{}
	if len(metadata) > 0 {
		if err := json.Unmarshal(metadata, &m); err != nil {
			return nil, fmt.Errorf("decode job metadata: %w", err)
		}
	}
	m[metaCollectionID] = id
	return json.Marshal(m)
}

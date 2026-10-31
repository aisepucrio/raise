-- +goose Up
CREATE TABLE collections (
    id          bigserial PRIMARY KEY,
    platform    text        NOT NULL,
    parameters  jsonb       NOT NULL,
    status      text        NOT NULL DEFAULT 'running'
                CHECK (status IN ('running', 'completed', 'partial', 'canceled')),
    created_by  bigint      REFERENCES users (id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz
);
CREATE INDEX collections_running_idx ON collections (id) WHERE status = 'running';

-- Progress counters are sharded so that many concurrent jobs of the same
-- collection don't all contend on a single row. Sum over shards to read.
CREATE TABLE collection_progress (
    collection_id bigint   NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
    shard         smallint NOT NULL,
    jobs_expected bigint   NOT NULL DEFAULT 0,
    jobs_done     bigint   NOT NULL DEFAULT 0,
    jobs_failed   bigint   NOT NULL DEFAULT 0,
    PRIMARY KEY (collection_id, shard)
);

-- Every failed attempt of a collection's jobs, kept after River deletes its
-- job rows, so a collection's log outlives the queue's retention.
CREATE TABLE collection_job_errors (
    id            bigserial PRIMARY KEY,
    collection_id bigint      NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
    job_id        bigint      NOT NULL,
    job_kind      text        NOT NULL,
    job_args      jsonb       NOT NULL,
    attempt       integer     NOT NULL,
    is_final      boolean     NOT NULL,
    error         text        NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX collection_job_errors_collection_idx ON collection_job_errors (collection_id, id);

-- +goose Down
DROP TABLE collection_job_errors;
DROP TABLE collection_progress;
DROP TABLE collections;

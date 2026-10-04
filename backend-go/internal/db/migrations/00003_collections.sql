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

-- +goose Down
DROP TABLE collection_progress;
DROP TABLE collections;

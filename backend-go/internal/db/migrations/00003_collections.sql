-- +goose Up
CREATE TABLE collections (
    id          bigserial PRIMARY KEY,
    platform    text        NOT NULL,
    params      jsonb       NOT NULL,
    status      text        NOT NULL DEFAULT 'running'
                CHECK (status IN ('running', 'completed', 'partial', 'canceled')),
    created_by  bigint      REFERENCES users (id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz
);
CREATE INDEX collections_running_idx ON collections (id) WHERE status = 'running';

-- Progress counters are sharded so that many concurrent jobs of the same
-- collection don't all contend on a single row.
CREATE TABLE collection_progress (
    collection_id bigint   NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
    shard         smallint NOT NULL,
    expected      bigint   NOT NULL DEFAULT 0,
    done          bigint   NOT NULL DEFAULT 0,
    failed        bigint   NOT NULL DEFAULT 0,
    PRIMARY KEY (collection_id, shard)
);

-- +goose Down
DROP TABLE collection_progress;
DROP TABLE collections;

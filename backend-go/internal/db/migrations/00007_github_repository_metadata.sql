-- +goose Up
-- Rows are snapshots that the next metadata run recreates with one query, so
-- existing ones are dropped instead of backfilling columns they can't know.
DELETE FROM github_repositories;

ALTER TABLE github_repositories
    ADD COLUMN owner_login   text    NOT NULL,
    ADD COLUMN owner_type    text    NOT NULL,
    ADD COLUMN label_count   integer NOT NULL,
    ADD COLUMN release_count integer NOT NULL;

-- +goose Down
ALTER TABLE github_repositories
    DROP COLUMN owner_login,
    DROP COLUMN owner_type,
    DROP COLUMN label_count,
    DROP COLUMN release_count;

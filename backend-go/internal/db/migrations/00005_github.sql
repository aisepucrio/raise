-- +goose Up
CREATE TABLE github_issues (
    repository_id   bigint      NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    number          integer     NOT NULL,
    github_id       bigint      NOT NULL,
    title           text        NOT NULL,
    state           text        NOT NULL,
    author_login    text,
    labels          text[]      NOT NULL,
    assignees       text[]      NOT NULL,
    comments_count  integer     NOT NULL,
    is_pull_request boolean     NOT NULL,
    body            text,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL,
    closed_at       timestamptz,
    raw             jsonb       NOT NULL, -- full API payload, for fields not modelled yet
    mined_at        timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (repository_id, number)
);

-- +goose Down
DROP TABLE github_issues;

-- +goose Up
CREATE TABLE github_issues (
    repository_id     bigint      NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    number            integer     NOT NULL,
    github_id         bigint      NOT NULL,
    title             text        NOT NULL,
    state             text        NOT NULL,
    author_login      text,
    label_names       text[]      NOT NULL,
    assignee_logins   text[]      NOT NULL,
    comment_count     integer     NOT NULL,
    is_pull_request   boolean     NOT NULL,
    body              text,
    github_created_at timestamptz NOT NULL,
    github_updated_at timestamptz NOT NULL,
    github_closed_at  timestamptz,
    raw_payload       jsonb       NOT NULL, -- full API response, for fields not modelled yet
    first_mined_at    timestamptz NOT NULL DEFAULT now(),
    last_mined_at     timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (repository_id, number)
);

-- +goose Down
DROP TABLE github_issues;

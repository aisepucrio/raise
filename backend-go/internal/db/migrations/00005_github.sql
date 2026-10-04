-- +goose Up
CREATE TABLE github_repositories (
    repository_id           bigint      PRIMARY KEY REFERENCES repositories (id) ON DELETE CASCADE,
    github_id               bigint      NOT NULL,
    github_node_id          text        NOT NULL,
    full_name               text        NOT NULL,
    description             text,
    homepage_url            text,
    default_branch          text,
    primary_language        text,
    language_bytes          jsonb       NOT NULL,
    topic_names             text[]      NOT NULL,
    license_spdx_id         text,
    visibility              text        NOT NULL,
    is_fork                 boolean     NOT NULL,
    is_archived             boolean     NOT NULL,
    is_template             boolean     NOT NULL,
    parent_full_name        text,
    star_count              integer     NOT NULL,
    watcher_count           integer     NOT NULL,
    fork_count              integer     NOT NULL,
    open_issue_count        integer     NOT NULL,
    open_pull_request_count integer     NOT NULL,
    github_created_at       timestamptz NOT NULL,
    github_updated_at       timestamptz NOT NULL,
    github_pushed_at        timestamptz,
    raw_payload             jsonb       NOT NULL,
    first_mined_at          timestamptz NOT NULL DEFAULT now(),
    last_mined_at           timestamptz NOT NULL DEFAULT now()
);

-- Issues and pull requests share GitHub's number space; pull requests have a
-- row here (the conversation) and one in github_pull_requests (the code).
CREATE TABLE github_issues (
    repository_id      bigint      NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    number             integer     NOT NULL,
    github_id          bigint      NOT NULL,
    github_node_id     text        NOT NULL,
    title              text        NOT NULL,
    state              text        NOT NULL,
    state_reason       text,
    author_login       text,
    author_association text        NOT NULL,
    label_names        text[]      NOT NULL,
    assignee_logins    text[]      NOT NULL,
    milestone_title    text,
    is_locked          boolean     NOT NULL,
    comment_count      integer     NOT NULL,
    reaction_counts    jsonb       NOT NULL,
    is_pull_request    boolean     NOT NULL,
    body               text,
    github_created_at  timestamptz NOT NULL,
    github_updated_at  timestamptz NOT NULL,
    github_closed_at   timestamptz,
    raw_payload        jsonb       NOT NULL, -- GraphQL node, for fields not modelled yet
    first_mined_at     timestamptz NOT NULL DEFAULT now(),
    last_mined_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (repository_id, number)
);

CREATE TABLE github_pull_requests (
    repository_id             bigint      NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    number                    integer     NOT NULL,
    github_id                 bigint      NOT NULL,
    github_node_id            text        NOT NULL,
    state                     text        NOT NULL,
    is_draft                  boolean     NOT NULL,
    is_merged                 boolean     NOT NULL,
    author_login              text,
    merged_by_login           text,
    head_ref                  text        NOT NULL,
    head_sha                  text        NOT NULL,
    head_repository_full_name text,
    base_ref                  text        NOT NULL,
    base_sha                  text        NOT NULL,
    merge_commit_sha          text,
    commit_count              integer     NOT NULL,
    files_changed             integer     NOT NULL,
    lines_added               integer     NOT NULL,
    lines_deleted             integer     NOT NULL,
    comment_count             integer     NOT NULL,
    review_count              integer     NOT NULL,
    review_thread_count       integer     NOT NULL,
    requested_reviewer_logins text[]      NOT NULL,
    github_created_at         timestamptz NOT NULL,
    github_updated_at         timestamptz NOT NULL,
    github_closed_at          timestamptz,
    github_merged_at          timestamptz,
    raw_payload               jsonb       NOT NULL,
    first_mined_at            timestamptz NOT NULL DEFAULT now(),
    last_mined_at             timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (repository_id, number)
);

-- sha is not a foreign key: commits from forks may not be in the mirror.
CREATE TABLE github_pull_request_commits (
    repository_id       bigint      NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    pull_request_number integer     NOT NULL,
    position            integer     NOT NULL,
    sha                 text        NOT NULL,
    first_mined_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (repository_id, pull_request_number, position)
);

CREATE TABLE github_pull_request_reviews (
    github_id           bigint      PRIMARY KEY,
    repository_id       bigint      NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    pull_request_number integer     NOT NULL,
    reviewer_login      text,
    author_association  text        NOT NULL,
    state               text        NOT NULL,
    body                text        NOT NULL,
    commit_sha          text,
    github_submitted_at timestamptz,
    github_updated_at   timestamptz NOT NULL,
    raw_payload         jsonb       NOT NULL,
    first_mined_at      timestamptz NOT NULL DEFAULT now(),
    last_mined_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON github_pull_request_reviews (repository_id, pull_request_number);

CREATE TABLE github_pull_request_review_comments (
    github_id             bigint      PRIMARY KEY,
    repository_id         bigint      NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    pull_request_number   integer     NOT NULL,
    review_github_id      bigint,
    in_reply_to_github_id bigint,
    thread_github_node_id text        NOT NULL,
    author_login          text,
    author_association    text        NOT NULL,
    path                  text        NOT NULL,
    line                  integer,
    original_line         integer,
    commit_sha            text,
    diff_hunk             text        NOT NULL,
    body                  text        NOT NULL,
    github_created_at     timestamptz NOT NULL,
    github_updated_at     timestamptz NOT NULL,
    raw_payload           jsonb       NOT NULL,
    first_mined_at        timestamptz NOT NULL DEFAULT now(),
    last_mined_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON github_pull_request_review_comments (repository_id, pull_request_number);

CREATE TABLE github_issue_comments (
    github_id          bigint      PRIMARY KEY,
    repository_id      bigint      NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    issue_number       integer     NOT NULL,
    author_login       text,
    author_association text        NOT NULL,
    body               text        NOT NULL,
    reaction_counts    jsonb       NOT NULL,
    github_created_at  timestamptz NOT NULL,
    github_updated_at  timestamptz NOT NULL,
    raw_payload        jsonb       NOT NULL,
    first_mined_at     timestamptz NOT NULL DEFAULT now(),
    last_mined_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON github_issue_comments (repository_id, issue_number);

-- Timeline events are immutable; some have no numeric ID, so the node ID is the key.
CREATE TABLE github_issue_events (
    github_node_id    text        PRIMARY KEY,
    repository_id     bigint      NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    issue_number      integer     NOT NULL,
    event_type        text        NOT NULL,
    actor_login       text,
    commit_sha        text,
    github_created_at timestamptz NOT NULL,
    raw_payload       jsonb       NOT NULL,
    first_mined_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON github_issue_events (repository_id, issue_number);

-- +goose Down
DROP TABLE github_issue_events;
DROP TABLE github_issue_comments;
DROP TABLE github_pull_request_review_comments;
DROP TABLE github_pull_request_reviews;
DROP TABLE github_pull_request_commits;
DROP TABLE github_pull_requests;
DROP TABLE github_issues;
DROP TABLE github_repositories;

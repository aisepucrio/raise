-- +goose Up
-- GitHub's view of a commit, shared between forks like commits itself.
CREATE TABLE github_commits (
    sha                   text        PRIMARY KEY REFERENCES commits (sha) ON DELETE CASCADE,
    github_node_id        text        NOT NULL,
    author_login          text,
    committer_login       text,
    is_signature_verified boolean     NOT NULL,
    raw_payload           jsonb       NOT NULL,
    first_mined_at        timestamptz NOT NULL DEFAULT now(),
    last_mined_at         timestamptz NOT NULL DEFAULT now()
);

-- Pull requests that introduced each commit into a repository. sha is not a
-- foreign key, matching github_pull_request_commits.
CREATE TABLE github_commit_pull_requests (
    repository_id       bigint      NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    sha                 text        NOT NULL,
    pull_request_number integer     NOT NULL,
    first_mined_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (repository_id, sha, pull_request_number)
);
CREATE INDEX ON github_commit_pull_requests (repository_id, pull_request_number);

-- +goose Down
DROP TABLE github_commit_pull_requests;
DROP TABLE github_commits;

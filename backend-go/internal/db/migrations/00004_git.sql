-- +goose Up
CREATE TABLE repositories (
    id                    bigserial PRIMARY KEY,
    url                   text        NOT NULL UNIQUE, -- canonical https URL, no .git suffix
    host                  text        NOT NULL,
    path                  text        NOT NULL,
    mirror_last_synced_at timestamptz,
    created_at            timestamptz NOT NULL DEFAULT now()
);

-- Forges (github, gitlab, …) that host this repository.
CREATE TABLE repository_remotes (
    repository_id bigint NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    platform      text   NOT NULL,
    owner         text   NOT NULL,
    name          text   NOT NULL,
    PRIMARY KEY (repository_id, platform)
);

-- Commits are content-addressed and shared between forks; repository_commits
-- records which repositories contain them. Commits are immutable, so they are
-- only ever inserted once.
CREATE TABLE commits (
    sha             text        PRIMARY KEY,
    parent_shas     text[]      NOT NULL,
    author_name     text        NOT NULL,
    author_email    text        NOT NULL,
    authored_at     timestamptz NOT NULL,
    committer_name  text        NOT NULL,
    committer_email text        NOT NULL,
    committed_at    timestamptz NOT NULL,
    message         text        NOT NULL,
    lines_added     integer     NOT NULL,
    lines_deleted   integer     NOT NULL,
    files_changed   integer     NOT NULL,
    first_mined_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE repository_commits (
    repository_id bigint NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    sha           text   NOT NULL REFERENCES commits (sha),
    PRIMARY KEY (repository_id, sha)
);

CREATE TABLE commit_files (
    sha                text    NOT NULL REFERENCES commits (sha) ON DELETE CASCADE,
    path               text    NOT NULL,
    previous_path      text,   -- set for renamed and copied files
    change_type        text    NOT NULL
                       CHECK (change_type IN ('added', 'modified', 'deleted', 'renamed', 'copied', 'type_changed', 'unmerged')),
    similarity_percent integer, -- for renamed and copied files
    lines_added        integer, -- NULL for binary files
    lines_deleted      integer,
    PRIMARY KEY (sha, path)
);

-- Branch and tag tips seen when commits were last planned.
CREATE TABLE repository_refs (
    repository_id bigint      NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    name          text        NOT NULL, -- e.g. refs/heads/main, refs/tags/v1.0
    commit_sha    text        NOT NULL, -- annotated tags are peeled to their commit
    last_seen_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (repository_id, name)
);

-- +goose Down
DROP TABLE repository_refs;
DROP TABLE commit_files;
DROP TABLE repository_commits;
DROP TABLE commits;
DROP TABLE repository_remotes;
DROP TABLE repositories;

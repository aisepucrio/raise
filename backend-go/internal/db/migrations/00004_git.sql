-- +goose Up
CREATE TABLE repositories (
    id               bigserial PRIMARY KEY,
    url              text        NOT NULL UNIQUE, -- canonical https URL, no .git suffix
    host             text        NOT NULL,
    path             text        NOT NULL,
    mirror_synced_at timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now()
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
-- records which repositories contain them.
CREATE TABLE commits (
    sha             text        PRIMARY KEY,
    parents         text[]      NOT NULL,
    author_name     text        NOT NULL,
    author_email    text        NOT NULL,
    authored_at     timestamptz NOT NULL,
    committer_name  text        NOT NULL,
    committer_email text        NOT NULL,
    committed_at    timestamptz NOT NULL,
    message         text        NOT NULL,
    additions       integer     NOT NULL,
    deletions       integer     NOT NULL,
    files_changed   integer     NOT NULL,
    mined_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE repository_commits (
    repository_id bigint NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    sha           text   NOT NULL REFERENCES commits (sha),
    PRIMARY KEY (repository_id, sha)
);

CREATE TABLE commit_files (
    sha        text    NOT NULL REFERENCES commits (sha) ON DELETE CASCADE,
    path       text    NOT NULL,
    old_path   text,
    status     text    NOT NULL, -- git --raw status letter: A, M, D, R, C, T
    similarity integer,          -- for renames/copies
    additions  integer,          -- NULL for binary files
    deletions  integer,
    PRIMARY KEY (sha, path)
);

-- Ref tips observed at the last plan.
CREATE TABLE refs (
    repository_id bigint      NOT NULL REFERENCES repositories (id) ON DELETE CASCADE,
    name          text        NOT NULL,
    sha           text        NOT NULL,
    observed_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (repository_id, name)
);

-- +goose Down
DROP TABLE refs;
DROP TABLE commit_files;
DROP TABLE repository_commits;
DROP TABLE commits;
DROP TABLE repository_remotes;
DROP TABLE repositories;

-- name: UpsertRepository :one
INSERT INTO repositories (url, host, path)
VALUES ($1, $2, $3)
ON CONFLICT (url) DO UPDATE SET url = EXCLUDED.url
RETURNING *;

-- name: UpsertRemote :exec
INSERT INTO repository_remotes (repository_id, platform, owner, name)
VALUES ($1, $2, $3, $4)
ON CONFLICT (repository_id, platform) DO UPDATE SET owner = EXCLUDED.owner, name = EXCLUDED.name;

-- name: GetRepository :one
SELECT * FROM repositories WHERE id = $1;

-- name: ListRepositories :many
SELECT * FROM repositories ORDER BY id DESC LIMIT $1 OFFSET $2;

-- name: ListRemotes :many
SELECT * FROM repository_remotes WHERE repository_id = ANY(sqlc.arg(repository_ids)::bigint[]);

-- name: MarkMirrorSynced :exec
UPDATE repositories SET mirror_last_synced_at = now() WHERE id = $1;

-- name: DeleteRefs :exec
DELETE FROM repository_refs WHERE repository_id = $1;

-- name: InsertRefs :exec
INSERT INTO repository_refs (repository_id, name, commit_sha)
SELECT sqlc.arg(repository_id), unnest(sqlc.arg(names)::text[]), unnest(sqlc.arg(shas)::text[]);

-- name: FilterUnminedCommits :many
SELECT s.sha::text FROM unnest(sqlc.arg(shas)::text[]) AS s(sha)
WHERE NOT EXISTS (
    SELECT 1 FROM repository_commits rc
    WHERE rc.repository_id = sqlc.arg(repository_id) AND rc.sha = s.sha
);

-- name: InsertCommit :batchexec
INSERT INTO commits (
    sha, parent_shas, author_name, author_email, authored_at,
    committer_name, committer_email, committed_at, message,
    lines_added, lines_deleted, files_changed
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT (sha) DO NOTHING;

-- name: InsertCommitFile :batchexec
INSERT INTO commit_files (sha, path, previous_path, change_type, similarity_percent, lines_added, lines_deleted)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (sha, path) DO NOTHING;

-- name: LinkCommits :exec
INSERT INTO repository_commits (repository_id, sha)
SELECT sqlc.arg(repository_id), unnest(sqlc.arg(shas)::text[])
ON CONFLICT DO NOTHING;

-- name: ListCommits :many
SELECT c.* FROM repository_commits rc
JOIN commits c ON c.sha = rc.sha
WHERE rc.repository_id = $1
ORDER BY c.committed_at DESC, c.sha
LIMIT $2 OFFSET $3;

-- name: GetRepositoryCommit :one
SELECT c.* FROM repository_commits rc
JOIN commits c ON c.sha = rc.sha
WHERE rc.repository_id = $1 AND rc.sha = $2;

-- name: ListCommitFiles :many
SELECT * FROM commit_files WHERE sha = $1 ORDER BY path;

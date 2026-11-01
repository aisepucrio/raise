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

-- name: InsertCommitFileDiff :batchexec
INSERT INTO commit_file_diffs (sha, path, diff, diff_size_bytes, is_diff_truncated)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (sha, path) DO NOTHING;

-- name: ListCommitsWithoutDiffs :many
-- The repository's mined commits with files whose diffs aren't mined yet.
-- Merges have no files, so they are never planned.
SELECT c.sha FROM repository_commits rc
JOIN commits c ON c.sha = rc.sha
WHERE rc.repository_id = $1
  AND c.files_changed > 0
  AND NOT EXISTS (SELECT 1 FROM commit_file_diffs d WHERE d.sha = c.sha)
ORDER BY c.authored_at, c.sha;

-- name: ListCommitFileDiffs :many
SELECT * FROM commit_file_diffs WHERE sha = $1;

-- name: GetRepositoryCommit :one
SELECT c.* FROM repository_commits rc
JOIN commits c ON c.sha = rc.sha
WHERE rc.repository_id = $1 AND rc.sha = $2;

-- name: ListCommitFiles :many
SELECT * FROM commit_files WHERE sha = $1 ORDER BY path;

-- Dashboard queries. A NULL repository_id means every repository. Commits are
-- counted once even when several repositories (forks) share them, and the
-- since/until window applies to authored_at.

-- name: ListDashboardEntities :many
SELECT id, host, path FROM repositories
WHERE sqlc.narg(repository_id)::bigint IS NULL OR id = sqlc.narg(repository_id)
ORDER BY host, path;

-- name: DashboardRepositories :one
SELECT count(*) AS repository_count, max(mirror_last_synced_at) AS mirror_last_synced_at
FROM repositories
WHERE sqlc.narg(repository_id)::bigint IS NULL OR id = sqlc.narg(repository_id);

-- name: DashboardCommits :one
SELECT count(*) AS commit_count,
       count(DISTINCT lower(c.author_email)) AS author_count,
       coalesce(sum(c.lines_added), 0)::bigint AS lines_added,
       coalesce(sum(c.lines_deleted), 0)::bigint AS lines_deleted,
       min(c.authored_at) AS first_authored_at,
       max(c.authored_at) AS last_authored_at
FROM commits c
WHERE EXISTS (
    SELECT 1 FROM repository_commits rc
    WHERE rc.sha = c.sha
      AND (sqlc.narg(repository_id)::bigint IS NULL OR rc.repository_id = sqlc.narg(repository_id))
)
  AND (sqlc.narg(since)::timestamptz IS NULL OR c.authored_at >= sqlc.narg(since))
  AND (sqlc.narg(until)::timestamptz IS NULL OR c.authored_at < sqlc.narg(until));

-- name: DashboardDateRange :one
SELECT min(c.authored_at) AS first_at, max(c.authored_at) AS last_at
FROM commits c
WHERE EXISTS (
    SELECT 1 FROM repository_commits rc
    WHERE rc.sha = c.sha
      AND (sqlc.narg(repository_id)::bigint IS NULL OR rc.repository_id = sqlc.narg(repository_id))
);

-- name: DashboardRefs :one
SELECT count(*) FILTER (WHERE name LIKE 'refs/heads/%') AS branch_count,
       count(*) FILTER (WHERE name LIKE 'refs/tags/%') AS tag_count
FROM repository_refs
WHERE sqlc.narg(repository_id)::bigint IS NULL OR repository_id = sqlc.narg(repository_id);

-- name: DashboardCommitActivity :many
-- Commits per interval up to until. There is no since bound: the dashboard's
-- cumulative graph needs the history before it.
SELECT date_trunc(sqlc.arg(interval)::text, c.authored_at, 'UTC')::timestamptz AS bucket,
       count(*) AS commit_count,
       count(DISTINCT lower(c.author_email)) AS author_count,
       coalesce(sum(c.lines_added), 0)::bigint AS lines_added,
       coalesce(sum(c.lines_deleted), 0)::bigint AS lines_deleted
FROM commits c
WHERE EXISTS (
    SELECT 1 FROM repository_commits rc
    WHERE rc.sha = c.sha
      AND (sqlc.narg(repository_id)::bigint IS NULL OR rc.repository_id = sqlc.narg(repository_id))
)
  AND (sqlc.narg(until)::timestamptz IS NULL OR c.authored_at < sqlc.narg(until))
GROUP BY 1
ORDER BY 1;

-- Repository data management (admin). Commits, their files and diffs are
-- shared between repositories (forks), so removing them from one repository
-- deletes only the rows no other repository contains.

-- name: RepositoryDataCounts :one
SELECT
    (SELECT count(*) FROM repository_commits rc WHERE rc.repository_id = sqlc.arg(repository_id)) AS commit_count,
    (SELECT count(*) FROM repository_commits rc
     WHERE rc.repository_id = sqlc.arg(repository_id)
       AND EXISTS (SELECT 1 FROM repository_commits o WHERE o.sha = rc.sha AND o.repository_id <> sqlc.arg(repository_id))) AS commit_shared_count,
    (SELECT count(*) FROM repository_refs rr WHERE rr.repository_id = sqlc.arg(repository_id)) AS ref_count,
    (SELECT count(*) FROM repository_commits rc JOIN commit_file_diffs d ON d.sha = rc.sha
     WHERE rc.repository_id = sqlc.arg(repository_id)) AS diff_count,
    (SELECT count(*) FROM repository_commits rc JOIN commit_file_diffs d ON d.sha = rc.sha
     WHERE rc.repository_id = sqlc.arg(repository_id)
       AND EXISTS (SELECT 1 FROM repository_commits o WHERE o.sha = rc.sha AND o.repository_id <> sqlc.arg(repository_id))) AS diff_shared_count,
    (SELECT max(d.first_mined_at) FROM repository_commits rc JOIN commit_file_diffs d ON d.sha = rc.sha
     WHERE rc.repository_id = sqlc.arg(repository_id)) AS diff_last_mined_at;

-- name: DeleteRepositoryCommits :one
-- Unlinks every commit from the repository and deletes those no other
-- repository contains; their files, diffs and forge enrichment
-- (github_commits) cascade. The NOT EXISTS sees the statement's snapshot,
-- in which the unlinked rows still exist, so it excludes this repository.
WITH unlinked AS (
    DELETE FROM repository_commits uc WHERE uc.repository_id = sqlc.arg(repository_id) RETURNING uc.sha
), deleted AS (
    DELETE FROM commits c USING unlinked u
    WHERE c.sha = u.sha
      AND NOT EXISTS (SELECT 1 FROM repository_commits o WHERE o.sha = c.sha AND o.repository_id <> sqlc.arg(repository_id))
    RETURNING 1
)
SELECT (SELECT count(*) FROM unlinked) AS unlinked_count, (SELECT count(*) FROM deleted) AS deleted_count;

-- name: DeleteRepositoryDiffs :execrows
DELETE FROM commit_file_diffs d USING repository_commits rc
WHERE rc.repository_id = sqlc.arg(repository_id) AND d.sha = rc.sha
  AND NOT EXISTS (SELECT 1 FROM repository_commits o WHERE o.sha = d.sha AND o.repository_id <> sqlc.arg(repository_id));

-- name: DeleteRepository :execrows
DELETE FROM repositories WHERE id = sqlc.arg(repository_id);

-- name: ListRepositoryIDs :many
SELECT id FROM repositories WHERE id = ANY(sqlc.arg(ids)::bigint[]);

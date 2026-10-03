-- name: UpsertIssue :batchexec
INSERT INTO github_issues (
    repository_id, number, github_id, title, state, author_login, labels, assignees,
    comments_count, is_pull_request, body, created_at, updated_at, closed_at, raw, mined_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now())
ON CONFLICT (repository_id, number) DO UPDATE SET
    github_id       = EXCLUDED.github_id,
    title           = EXCLUDED.title,
    state           = EXCLUDED.state,
    author_login    = EXCLUDED.author_login,
    labels          = EXCLUDED.labels,
    assignees       = EXCLUDED.assignees,
    comments_count  = EXCLUDED.comments_count,
    is_pull_request = EXCLUDED.is_pull_request,
    body            = EXCLUDED.body,
    created_at      = EXCLUDED.created_at,
    updated_at      = EXCLUDED.updated_at,
    closed_at       = EXCLUDED.closed_at,
    raw             = EXCLUDED.raw,
    mined_at        = now()
WHERE github_issues.updated_at <= EXCLUDED.updated_at;

-- name: ListIssues :many
SELECT repository_id, number, github_id, title, state, author_login, labels, assignees,
       comments_count, is_pull_request, created_at, updated_at, closed_at
FROM github_issues
WHERE repository_id = $1
  AND (sqlc.narg(state)::text IS NULL OR state = sqlc.narg(state))
  AND (sqlc.narg(is_pull_request)::boolean IS NULL OR is_pull_request = sqlc.narg(is_pull_request))
ORDER BY number DESC
LIMIT $2 OFFSET $3;

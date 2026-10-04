-- name: UpsertIssue :batchexec
INSERT INTO github_issues (
    repository_id, number, github_id, title, state, author_login, label_names, assignee_logins,
    comment_count, is_pull_request, body, github_created_at, github_updated_at, github_closed_at, raw_payload
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
ON CONFLICT (repository_id, number) DO UPDATE SET
    github_id         = EXCLUDED.github_id,
    title             = EXCLUDED.title,
    state             = EXCLUDED.state,
    author_login      = EXCLUDED.author_login,
    label_names       = EXCLUDED.label_names,
    assignee_logins   = EXCLUDED.assignee_logins,
    comment_count     = EXCLUDED.comment_count,
    is_pull_request   = EXCLUDED.is_pull_request,
    body              = EXCLUDED.body,
    github_created_at = EXCLUDED.github_created_at,
    github_updated_at = EXCLUDED.github_updated_at,
    github_closed_at  = EXCLUDED.github_closed_at,
    raw_payload       = EXCLUDED.raw_payload,
    last_mined_at     = now()
-- Never overwrite newer data with an older snapshot (pages can be fetched out of order).
WHERE github_issues.github_updated_at <= EXCLUDED.github_updated_at;

-- name: ListIssues :many
SELECT repository_id, number, github_id, title, state, author_login, label_names, assignee_logins,
       comment_count, is_pull_request, github_created_at, github_updated_at, github_closed_at,
       first_mined_at, last_mined_at
FROM github_issues
WHERE repository_id = $1
  AND (sqlc.narg(state)::text IS NULL OR state = sqlc.narg(state))
  AND (sqlc.narg(is_pull_request)::boolean IS NULL OR is_pull_request = sqlc.narg(is_pull_request))
ORDER BY number DESC
LIMIT $2 OFFSET $3;

-- name: CreateCollection :one
INSERT INTO collections (platform, parameters, created_by)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetCollection :one
SELECT c.*,
       coalesce(sum(p.jobs_expected), 0)::bigint AS jobs_expected,
       coalesce(sum(p.jobs_done), 0)::bigint     AS jobs_done,
       coalesce(sum(p.jobs_failed), 0)::bigint   AS jobs_failed
FROM collections c
LEFT JOIN collection_progress p ON p.collection_id = c.id
WHERE c.id = $1
GROUP BY c.id;

-- name: ListCollections :many
SELECT c.*,
       coalesce(sum(p.jobs_expected), 0)::bigint AS jobs_expected,
       coalesce(sum(p.jobs_done), 0)::bigint     AS jobs_done,
       coalesce(sum(p.jobs_failed), 0)::bigint   AS jobs_failed
FROM collections c
LEFT JOIN collection_progress p ON p.collection_id = c.id
GROUP BY c.id
ORDER BY c.id DESC
LIMIT $1 OFFSET $2;

-- name: CancelCollection :execrows
UPDATE collections SET status = 'canceled', finished_at = now()
WHERE id = $1 AND status = 'running';

-- name: FinishSettledCollections :execrows
-- Marks running collections whose jobs have all settled. Collections that never
-- enqueued anything are finished after a grace period.
WITH totals AS (
    SELECT c.id,
           c.created_at,
           coalesce(sum(p.jobs_expected), 0) AS jobs_expected,
           coalesce(sum(p.jobs_done), 0)     AS jobs_done,
           coalesce(sum(p.jobs_failed), 0)   AS jobs_failed
    FROM collections c
    LEFT JOIN collection_progress p ON p.collection_id = c.id
    WHERE c.status = 'running'
    GROUP BY c.id
)
UPDATE collections c
SET status      = CASE WHEN t.jobs_failed > 0 THEN 'partial' ELSE 'completed' END,
    finished_at = now()
FROM totals t
WHERE c.id = t.id
  AND ((t.jobs_expected > 0 AND t.jobs_done + t.jobs_failed >= t.jobs_expected)
       OR (t.jobs_expected = 0 AND t.created_at < now() - interval '1 minute'));

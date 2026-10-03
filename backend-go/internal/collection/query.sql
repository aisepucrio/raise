-- name: CreateCollection :one
INSERT INTO collections (platform, params, created_by)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetCollection :one
SELECT c.*,
       coalesce(sum(p.expected), 0)::bigint AS expected,
       coalesce(sum(p.done), 0)::bigint     AS done,
       coalesce(sum(p.failed), 0)::bigint   AS failed
FROM collections c
LEFT JOIN collection_progress p ON p.collection_id = c.id
WHERE c.id = $1
GROUP BY c.id;

-- name: ListCollections :many
SELECT c.*,
       coalesce(sum(p.expected), 0)::bigint AS expected,
       coalesce(sum(p.done), 0)::bigint     AS done,
       coalesce(sum(p.failed), 0)::bigint   AS failed
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
           coalesce(sum(p.expected), 0) AS expected,
           coalesce(sum(p.done), 0)     AS done,
           coalesce(sum(p.failed), 0)   AS failed
    FROM collections c
    LEFT JOIN collection_progress p ON p.collection_id = c.id
    WHERE c.status = 'running'
    GROUP BY c.id
)
UPDATE collections c
SET status      = CASE WHEN t.failed > 0 THEN 'partial' ELSE 'completed' END,
    finished_at = now()
FROM totals t
WHERE c.id = t.id
  AND ((t.expected > 0 AND t.done + t.failed >= t.expected)
       OR (t.expected = 0 AND t.created_at < now() - interval '1 minute'));

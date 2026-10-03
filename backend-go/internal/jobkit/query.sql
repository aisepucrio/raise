-- name: AddProgress :exec
INSERT INTO collection_progress (collection_id, shard, expected, done, failed)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (collection_id, shard) DO UPDATE SET
    expected = collection_progress.expected + EXCLUDED.expected,
    done     = collection_progress.done + EXCLUDED.done,
    failed   = collection_progress.failed + EXCLUDED.failed;

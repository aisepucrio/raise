-- name: AddJobError :exec
INSERT INTO collection_job_errors (collection_id, job_id, job_kind, job_args, attempt, is_final, error)
VALUES ($1, $2, $3, $4, $5, $6, $7);

-- name: AddProgress :exec
INSERT INTO collection_progress (collection_id, shard, jobs_expected, jobs_done, jobs_failed)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (collection_id, shard) DO UPDATE SET
    jobs_expected = collection_progress.jobs_expected + EXCLUDED.jobs_expected,
    jobs_done     = collection_progress.jobs_done + EXCLUDED.jobs_done,
    jobs_failed   = collection_progress.jobs_failed + EXCLUDED.jobs_failed;

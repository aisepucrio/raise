-- name: InsertCredential :one
INSERT INTO credentials (
    platform, kind, label, public_fields, secret_hints,
    secret_ciphertext, secret_nonce, key_version, status,
    last_tested_at, last_test_result, created_by
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $10, $11)
RETURNING *;

-- name: ListCredentials :many
SELECT * FROM credentials
WHERE deleted_at IS NULL
  AND (sqlc.narg(platform)::text IS NULL OR platform = sqlc.narg(platform))
ORDER BY platform, id;

-- name: GetCredential :one
SELECT * FROM credentials WHERE id = $1 AND deleted_at IS NULL;

-- name: SoftDeleteCredential :execrows
UPDATE credentials SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL;

-- name: RecordTestResult :one
UPDATE credentials
SET status = $2, last_tested_at = now(), last_test_result = $3
WHERE id = $1
RETURNING *;

-- name: MarkCredentialInvalid :exec
UPDATE credentials
SET status = 'invalid', last_test_result = jsonb_build_object('ok', false, 'reason', sqlc.arg(reason)::text)
WHERE id = $1 AND status = 'active';

-- name: PickCredential :one
-- The active credential with the most remaining quota in the given scope.
-- Credentials without known quota (never used) or whose window has reset are
-- preferred; random() spreads load between equally good candidates.
SELECT c.* FROM credentials c
LEFT JOIN credential_quota q ON q.credential_id = c.id AND q.scope = sqlc.arg(scope)
WHERE c.platform = sqlc.arg(platform)
  AND c.status = 'active'
  AND c.deleted_at IS NULL
  AND (q.credential_id IS NULL OR q.remaining > 0 OR q.reset_at <= now())
ORDER BY CASE WHEN q.credential_id IS NULL OR q.reset_at <= now() THEN 2147483647 ELSE q.remaining END DESC,
         random()
LIMIT 1;

-- name: ConsumeQuota :exec
-- Optimistic local decrement; the next API response overwrites it with the real value.
UPDATE credential_quota SET remaining = remaining - 1
WHERE credential_id = $1 AND scope = $2 AND remaining > 0 AND reset_at > now();

-- name: UpsertQuota :exec
INSERT INTO credential_quota (credential_id, scope, quota_limit, remaining, reset_at, updated_at)
VALUES ($1, $2, $3, $4, $5, now())
ON CONFLICT (credential_id, scope) DO UPDATE SET
    quota_limit = EXCLUDED.quota_limit,
    remaining   = EXCLUDED.remaining,
    reset_at    = EXCLUDED.reset_at,
    updated_at  = now();

-- name: NextQuotaReset :one
SELECT q.reset_at FROM credential_quota q
JOIN credentials c ON c.id = q.credential_id
WHERE c.platform = $1 AND q.scope = $2
  AND c.status = 'active' AND c.deleted_at IS NULL
  AND q.reset_at > now()
ORDER BY q.reset_at
LIMIT 1;

-- name: CountActiveCredentials :one
SELECT count(*) FROM credentials
WHERE platform = $1 AND status = 'active' AND deleted_at IS NULL;

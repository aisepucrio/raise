-- name: InsertCredential :one
INSERT INTO credentials (
    platform, kind, label, public_fields, secret_hints,
    secret_ciphertext, secret_nonce, encryption_key_version, status,
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
LEFT JOIN credential_quotas q ON q.credential_id = c.id AND q.scope = sqlc.arg(scope)
WHERE c.platform = sqlc.arg(platform)
  AND c.status = 'active'
  AND c.deleted_at IS NULL
  AND (q.credential_id IS NULL OR q.requests_remaining > 0 OR q.resets_at <= now())
ORDER BY CASE WHEN q.credential_id IS NULL OR q.resets_at <= now() THEN 2147483647 ELSE q.requests_remaining END DESC,
         random()
LIMIT 1;

-- name: ConsumeQuota :exec
-- Optimistic local decrement; the next API response overwrites it with the real value.
UPDATE credential_quotas SET requests_remaining = requests_remaining - 1
WHERE credential_id = $1 AND scope = $2 AND requests_remaining > 0 AND resets_at > now();

-- name: UpsertQuota :exec
INSERT INTO credential_quotas (credential_id, scope, request_limit, requests_remaining, resets_at, observed_at)
VALUES ($1, $2, $3, $4, $5, now())
ON CONFLICT (credential_id, scope) DO UPDATE SET
    request_limit      = EXCLUDED.request_limit,
    requests_remaining = EXCLUDED.requests_remaining,
    resets_at          = EXCLUDED.resets_at,
    observed_at        = now();

-- name: NextQuotaReset :one
SELECT q.resets_at FROM credential_quotas q
JOIN credentials c ON c.id = q.credential_id
WHERE c.platform = $1 AND q.scope = $2
  AND c.status = 'active' AND c.deleted_at IS NULL
  AND q.resets_at > now()
ORDER BY q.resets_at
LIMIT 1;

-- name: CountActiveCredentials :one
SELECT count(*) FROM credentials
WHERE platform = $1 AND status = 'active' AND deleted_at IS NULL;

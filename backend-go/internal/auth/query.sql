-- name: CreateUser :one
INSERT INTO users (username, password_hash, role)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUser :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByUsername :one
SELECT * FROM users WHERE lower(username) = lower($1);

-- name: HasUsers :one
SELECT EXISTS (SELECT 1 FROM users);

-- name: ListUsers :many
SELECT * FROM users ORDER BY username;

-- name: UpdateUser :one
UPDATE users SET
    username      = coalesce(sqlc.narg(username), username),
    role          = coalesce(sqlc.narg(role), role),
    is_disabled   = coalesce(sqlc.narg(is_disabled), is_disabled),
    password_hash = coalesce(sqlc.narg(password_hash), password_hash),
    -- A new password ends every existing session.
    session_version = session_version + CASE WHEN sqlc.narg(password_hash)::text IS NULL THEN 0 ELSE 1 END,
    updated_at    = now()
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: DeleteUser :execrows
DELETE FROM users WHERE id = $1;


-- name: CreateAPIKey :one
INSERT INTO api_keys (user_id, label, token_prefix, token_hash, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListAPIKeys :many
SELECT * FROM api_keys WHERE user_id = $1 AND revoked_at IS NULL ORDER BY created_at DESC;

-- name: RevokeAPIKey :execrows
UPDATE api_keys SET revoked_at = now()
WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL;

-- name: RevokeUserAPIKeys :exec
UPDATE api_keys SET revoked_at = now()
WHERE user_id = $1 AND revoked_at IS NULL;

-- name: UseAPIKey :one
-- Resolves an API key to its user and bumps last_used_at.
UPDATE api_keys k SET last_used_at = now()
FROM users u
WHERE k.token_hash = $1
  AND k.revoked_at IS NULL
  AND (k.expires_at IS NULL OR k.expires_at > now())
  AND u.id = k.user_id
  AND NOT u.is_disabled
RETURNING u.id, u.username, u.role;

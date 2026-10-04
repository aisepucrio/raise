-- +goose Up
CREATE TABLE users (
    id            bigserial PRIMARY KEY,
    username      text        NOT NULL,
    password_hash text        NOT NULL,
    role          text        NOT NULL CHECK (role IN ('viewer', 'researcher', 'admin')),
    is_disabled   boolean     NOT NULL DEFAULT false,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_username_key ON users (lower(username));

-- Managed by github.com/alexedwards/scs/pgxstore; its column names are fixed.
CREATE TABLE sessions (
    token  text PRIMARY KEY,
    data   bytea       NOT NULL,
    expiry timestamptz NOT NULL
);
CREATE INDEX sessions_expiry_idx ON sessions (expiry);

CREATE TABLE api_keys (
    id           bigserial PRIMARY KEY,
    user_id      bigint      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    label        text        NOT NULL,
    token_prefix text        NOT NULL, -- first characters of the token, for display
    token_hash   bytea       NOT NULL UNIQUE,
    created_at   timestamptz NOT NULL DEFAULT now(),
    last_used_at timestamptz,
    expires_at   timestamptz,
    revoked_at   timestamptz
);
CREATE INDEX api_keys_user_id_idx ON api_keys (user_id);

-- +goose Down
DROP TABLE api_keys;
DROP TABLE sessions;
DROP TABLE users;

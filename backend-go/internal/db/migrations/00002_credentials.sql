-- +goose Up
CREATE TABLE credentials (
    id                bigserial PRIMARY KEY,
    platform          text        NOT NULL,
    kind              text        NOT NULL,
    label             text        NOT NULL,
    public_fields     jsonb       NOT NULL DEFAULT '{}',
    secret_hints      jsonb       NOT NULL DEFAULT '{}',
    secret_ciphertext bytea       NOT NULL,
    secret_nonce      bytea       NOT NULL,
    key_version       integer     NOT NULL,
    status            text        NOT NULL CHECK (status IN ('active', 'invalid', 'disabled')),
    last_tested_at    timestamptz,
    last_test_result  jsonb,
    created_by        bigint      REFERENCES users (id) ON DELETE SET NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz
);
CREATE INDEX credentials_platform_idx ON credentials (platform) WHERE deleted_at IS NULL;

-- Observed rate-limit state per credential. A platform may have several
-- independent buckets (GitHub: "core", "search", "graphql").
CREATE TABLE credential_quota (
    credential_id bigint      NOT NULL REFERENCES credentials (id) ON DELETE CASCADE,
    scope         text        NOT NULL,
    quota_limit   integer     NOT NULL,
    remaining     integer     NOT NULL,
    reset_at      timestamptz NOT NULL,
    updated_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (credential_id, scope)
);

-- +goose Down
DROP TABLE credential_quota;
DROP TABLE credentials;

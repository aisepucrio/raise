-- +goose Up
CREATE TABLE credentials (
    id                     bigserial PRIMARY KEY,
    platform               text        NOT NULL,
    kind                   text        NOT NULL,
    label                  text        NOT NULL,
    public_fields          jsonb       NOT NULL DEFAULT '{}',
    secret_hints           jsonb       NOT NULL DEFAULT '{}',
    secret_ciphertext      bytea       NOT NULL,
    secret_nonce           bytea       NOT NULL,
    encryption_key_version integer     NOT NULL,
    status                 text        NOT NULL CHECK (status IN ('active', 'invalid', 'disabled')),
    last_tested_at         timestamptz,
    last_test_result       jsonb,
    created_by             bigint      REFERENCES users (id) ON DELETE SET NULL,
    created_at             timestamptz NOT NULL DEFAULT now(),
    deleted_at             timestamptz
);
CREATE INDEX credentials_platform_idx ON credentials (platform) WHERE deleted_at IS NULL;

-- Rate-limit state last observed per credential. A platform may have several
-- independent buckets (GitHub: "core", "search", "graphql").
CREATE TABLE credential_quotas (
    credential_id      bigint      NOT NULL REFERENCES credentials (id) ON DELETE CASCADE,
    scope              text        NOT NULL,
    request_limit      integer     NOT NULL,
    requests_remaining integer     NOT NULL,
    resets_at          timestamptz NOT NULL,
    observed_at        timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (credential_id, scope)
);

-- +goose Down
DROP TABLE credential_quotas;
DROP TABLE credentials;

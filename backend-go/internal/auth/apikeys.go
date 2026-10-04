package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"time"

	"raise/internal/apperr"
	"raise/internal/auth/sqlc"
)

const apiKeyPrefix = "rk_"

type APIKey struct {
	ID          int64      `json:"id"`
	Label       string     `json:"label"`
	TokenPrefix string     `json:"token_prefix"`
	CreatedAt   time.Time  `json:"created_at"`
	LastUsedAt  *time.Time `json:"last_used_at,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
}

func toAPIKey(k sqlc.ApiKey) APIKey {
	return APIKey{ID: k.ID, Label: k.Label, TokenPrefix: k.TokenPrefix, CreatedAt: k.CreatedAt, LastUsedAt: k.LastUsedAt, ExpiresAt: k.ExpiresAt}
}

// CreateAPIKey returns the plaintext token, which is shown to the user once
// and never stored. Tokens are 256-bit random, so a plain SHA-256 is a
// sufficient at-rest hash (no slow KDF needed, unlike passwords).
func (s *Service) CreateAPIKey(ctx context.Context, userID int64, label string, expiresAt *time.Time) (string, APIKey, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", APIKey{}, err
	}
	token := apiKeyPrefix + base64.RawURLEncoding.EncodeToString(buf)
	k, err := s.q.CreateAPIKey(ctx, sqlc.CreateAPIKeyParams{
		UserID:      userID,
		Label:       label,
		TokenPrefix: token[:len(apiKeyPrefix)+6],
		TokenHash:   hashToken(token),
		ExpiresAt:   expiresAt,
	})
	if err != nil {
		return "", APIKey{}, err
	}
	return token, toAPIKey(k), nil
}

func (s *Service) ListAPIKeys(ctx context.Context, userID int64) ([]APIKey, error) {
	rows, err := s.q.ListAPIKeys(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]APIKey, len(rows))
	for i, k := range rows {
		out[i] = toAPIKey(k)
	}
	return out, nil
}

func (s *Service) RevokeAPIKey(ctx context.Context, userID, id int64) error {
	n, err := s.q.RevokeAPIKey(ctx, sqlc.RevokeAPIKeyParams{ID: id, UserID: userID})
	if err != nil {
		return err
	}
	if n == 0 {
		return fmt.Errorf("%w: api key %d", apperr.ErrNotFound, id)
	}
	return nil
}

func hashToken(token string) []byte {
	sum := sha256.Sum256([]byte(token))
	return sum[:]
}

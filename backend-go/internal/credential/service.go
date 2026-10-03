package credential

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"raise/internal/apperr"
	"raise/internal/credential/sqlc"
	"raise/internal/platform"
)

// View is a credential as exposed over the API: never the secret itself.
type View struct {
	ID             int64                `json:"id"`
	Platform       platform.ID          `json:"platform"`
	Kind           string               `json:"kind"`
	Label          string               `json:"label"`
	Public         map[string]string    `json:"public"`
	SecretHints    map[string]string    `json:"secret_hints" doc:"Last characters of each secret field"`
	Status         string               `json:"status" enum:"active,invalid,disabled"`
	LastTestedAt   *time.Time           `json:"last_tested_at,omitempty"`
	LastTestResult *platform.TestResult `json:"last_test_result,omitempty"`
	CreatedAt      time.Time            `json:"created_at"`
}

type Service struct {
	q        *sqlc.Queries
	keys     *Keyring
	registry *platform.Registry
}

func NewService(pool *pgxpool.Pool, keys *Keyring, registry *platform.Registry) *Service {
	return &Service{q: sqlc.New(pool), keys: keys, registry: registry}
}

func (s *Service) List(ctx context.Context, p *platform.ID) ([]View, error) {
	var filter *string
	if p != nil {
		f := string(*p)
		filter = &f
	}
	rows, err := s.q.ListCredentials(ctx, filter)
	if err != nil {
		return nil, err
	}
	out := make([]View, len(rows))
	for i, r := range rows {
		out[i] = toView(r)
	}
	return out, nil
}

// Add validates the fields against the platform's credential kind, tests the
// credential against the live API and stores it encrypted. Credentials that
// fail the test are stored as invalid so the admin can see why.
func (s *Service) Add(ctx context.Context, createdBy int64, pid platform.ID, kind, label string, fields map[string]string) (View, error) {
	p, ok := s.registry.Credentialed(pid)
	if !ok {
		return View{}, fmt.Errorf("%w: platform %q does not use credentials", apperr.ErrInvalid, pid)
	}
	k, ok := findKind(p.CredentialKinds(), kind)
	if !ok {
		return View{}, fmt.Errorf("%w: platform %q has no credential kind %q", apperr.ErrInvalid, pid, kind)
	}

	cred := platform.Credential{Platform: pid, Kind: kind, Public: map[string]string{}, Secret: map[string]string{}}
	hints := map[string]string{}
	for _, f := range k.Fields {
		v := strings.TrimSpace(fields[f.Name])
		if v == "" {
			if !f.Optional {
				return View{}, fmt.Errorf("%w: field %q is required", apperr.ErrInvalid, f.Name)
			}
			continue
		}
		if f.Secret {
			cred.Secret[f.Name] = v
			hints[f.Name] = hint(v)
		} else {
			cred.Public[f.Name] = v
		}
	}

	result, err := p.TestCredential(ctx, cred)
	if err != nil {
		return View{}, fmt.Errorf("test credential: %w", err)
	}

	secretJSON, _ := json.Marshal(cred.Secret)
	ver, nonce, ct, err := s.keys.Seal(secretJSON, aad(pid, kind))
	if err != nil {
		return View{}, err
	}
	publicJSON, _ := json.Marshal(cred.Public)
	hintsJSON, _ := json.Marshal(hints)
	resultJSON, _ := json.Marshal(result)
	row, err := s.q.InsertCredential(ctx, sqlc.InsertCredentialParams{
		Platform:         string(pid),
		Kind:             kind,
		Label:            label,
		PublicFields:     publicJSON,
		SecretHints:      hintsJSON,
		SecretCiphertext: ct,
		SecretNonce:      nonce,
		KeyVersion:       ver,
		Status:           statusFor(result),
		LastTestResult:   resultJSON,
		CreatedBy:        &createdBy,
	})
	if err != nil {
		return View{}, err
	}
	return toView(row), nil
}

// Test re-runs the platform's test procedure and updates the stored status.
func (s *Service) Test(ctx context.Context, id int64) (View, error) {
	row, err := s.q.GetCredential(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return View{}, fmt.Errorf("%w: credential %d", apperr.ErrNotFound, id)
	}
	if err != nil {
		return View{}, err
	}
	p, ok := s.registry.Credentialed(platform.ID(row.Platform))
	if !ok {
		return View{}, fmt.Errorf("platform %q is no longer registered", row.Platform)
	}
	cred, err := decrypt(s.keys, row)
	if err != nil {
		return View{}, err
	}
	result, err := p.TestCredential(ctx, cred)
	if err != nil {
		return View{}, fmt.Errorf("test credential: %w", err)
	}
	resultJSON, _ := json.Marshal(result)
	row, err = s.q.RecordTestResult(ctx, sqlc.RecordTestResultParams{ID: id, Status: statusFor(result), LastTestResult: resultJSON})
	if err != nil {
		return View{}, err
	}
	return toView(row), nil
}

func (s *Service) Delete(ctx context.Context, id int64) error {
	n, err := s.q.SoftDeleteCredential(ctx, id)
	if err != nil {
		return err
	}
	if n == 0 {
		return fmt.Errorf("%w: credential %d", apperr.ErrNotFound, id)
	}
	return nil
}

func decrypt(keys *Keyring, row sqlc.Credential) (platform.Credential, error) {
	c := platform.Credential{ID: row.ID, Platform: platform.ID(row.Platform), Kind: row.Kind}
	if err := json.Unmarshal(row.PublicFields, &c.Public); err != nil {
		return c, fmt.Errorf("decode public fields: %w", err)
	}
	pt, err := keys.Open(row.KeyVersion, row.SecretNonce, row.SecretCiphertext, aad(c.Platform, c.Kind))
	if err != nil {
		return c, fmt.Errorf("decrypt credential %d: %w", row.ID, err)
	}
	if err := json.Unmarshal(pt, &c.Secret); err != nil {
		return c, fmt.Errorf("decode secret fields: %w", err)
	}
	return c, nil
}

func toView(r sqlc.Credential) View {
	v := View{
		ID: r.ID, Platform: platform.ID(r.Platform), Kind: r.Kind, Label: r.Label,
		Status: r.Status, LastTestedAt: r.LastTestedAt, CreatedAt: r.CreatedAt,
	}
	_ = json.Unmarshal(r.PublicFields, &v.Public)
	_ = json.Unmarshal(r.SecretHints, &v.SecretHints)
	if len(r.LastTestResult) > 0 {
		v.LastTestResult = &platform.TestResult{}
		_ = json.Unmarshal(r.LastTestResult, v.LastTestResult)
	}
	return v
}

func findKind(kinds []platform.CredentialKind, name string) (platform.CredentialKind, bool) {
	for _, k := range kinds {
		if k.Name == name {
			return k, true
		}
	}
	return platform.CredentialKind{}, false
}

func statusFor(r platform.TestResult) string {
	if r.OK {
		return "active"
	}
	return "invalid"
}

func hint(secret string) string {
	if len(secret) <= 8 {
		return "…"
	}
	return "…" + secret[len(secret)-4:]
}

func aad(p platform.ID, kind string) []byte {
	return []byte(string(p) + "/" + kind)
}

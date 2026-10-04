package credential

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"raise/internal/credential/sqlc"
	"raise/internal/jobkit"
	"raise/internal/platform"
)

// Pool leases credentials to jobs. It implements platform.Leaser.
//
// Selection happens in SQL (most remaining quota wins, ties broken randomly)
// without row locks, so many workers can lease concurrently; quota counts are
// optimistic and corrected by the values platforms report from API responses.
type Pool struct {
	q    *sqlc.Queries
	keys *Keyring
}

func NewPool(pool *pgxpool.Pool, keys *Keyring) *Pool {
	return &Pool{q: sqlc.New(pool), keys: keys}
}

func (p *Pool) Lease(ctx context.Context, pid platform.ID, scope string) (platform.Lease, error) {
	row, err := p.q.PickCredential(ctx, sqlc.PickCredentialParams{Platform: string(pid), Scope: scope})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, p.unavailable(ctx, pid, scope)
	}
	if err != nil {
		return nil, err
	}
	if err := p.q.ConsumeQuota(ctx, sqlc.ConsumeQuotaParams{CredentialID: row.ID, Scope: scope}); err != nil {
		return nil, err
	}
	cred, err := decrypt(p.keys, row)
	if err != nil {
		return nil, err
	}
	return &lease{q: p.q, cred: cred}, nil
}

// unavailable explains why no credential could be leased: either all are
// exhausted until a known reset time, or there are none at all.
func (p *Pool) unavailable(ctx context.Context, pid platform.ID, scope string) error {
	reset, err := p.q.NextQuotaReset(ctx, sqlc.NextQuotaResetParams{Platform: string(pid), Scope: scope})
	if err == nil {
		return &jobkit.RateLimitedError{Platform: string(pid), ResetAt: reset}
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	return fmt.Errorf("%w for platform %s", jobkit.ErrNoCredential, pid)
}

type lease struct {
	q    *sqlc.Queries
	cred platform.Credential
}

func (l *lease) Credential() platform.Credential { return l.cred }

func (l *lease) Report(ctx context.Context, q platform.Quota) error {
	return l.q.UpsertQuota(ctx, sqlc.UpsertQuotaParams{
		CredentialID:      l.cred.ID,
		Scope:             q.Scope,
		RequestLimit:      int32(q.RequestLimit),
		RequestsRemaining: int32(q.RequestsRemaining),
		ResetsAt:          q.ResetsAt,
	})
}

func (l *lease) Invalidate(ctx context.Context, reason string) error {
	return l.q.MarkCredentialInvalid(ctx, sqlc.MarkCredentialInvalidParams{ID: l.cred.ID, Reason: reason})
}

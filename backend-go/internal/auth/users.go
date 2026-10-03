// Package auth implements local accounts: users with roles, cookie sessions
// for the frontend (scs, stored in Postgres) and personal API keys for
// scripted access. Both resolve to an access.Principal.
package auth

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"sync"
	"time"

	"github.com/alexedwards/argon2id"
	"github.com/alexedwards/scs/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"raise/internal/access"
	"raise/internal/apperr"
	"raise/internal/auth/sqlc"
)

const minPasswordLength = 12

var usernameRE = regexp.MustCompile(`^[a-zA-Z0-9._-]{2,64}$`)

type User struct {
	ID        int64       `json:"id"`
	Username  string      `json:"username"`
	Role      access.Role `json:"role" enum:"viewer,researcher,admin"`
	Disabled  bool        `json:"disabled"`
	CreatedAt time.Time   `json:"created_at"`
}

func toUser(u sqlc.User) User {
	return User{ID: u.ID, Username: u.Username, Role: access.Role(u.Role), Disabled: u.Disabled, CreatedAt: u.CreatedAt}
}

type Service struct {
	q        *sqlc.Queries
	sessions *scs.SessionManager
	limiter  *loginLimiter
}

// NewService builds the auth service. sessions may be nil for CLI use.
func NewService(pool *pgxpool.Pool, sessions *scs.SessionManager) *Service {
	return &Service{q: sqlc.New(pool), sessions: sessions, limiter: newLoginLimiter()}
}

func (s *Service) CreateUser(ctx context.Context, username, password string, role access.Role) (User, error) {
	if !usernameRE.MatchString(username) {
		return User{}, fmt.Errorf("%w: username must be 2-64 characters of letters, digits, '.', '_' or '-'", apperr.ErrInvalid)
	}
	hash, err := hashPassword(password)
	if err != nil {
		return User{}, err
	}
	u, err := s.q.CreateUser(ctx, sqlc.CreateUserParams{Username: username, PasswordHash: hash, Role: string(role)})
	if isUniqueViolation(err) {
		return User{}, fmt.Errorf("%w: username %q is taken", apperr.ErrConflict, username)
	}
	if err != nil {
		return User{}, err
	}
	return toUser(u), nil
}

func (s *Service) GetUser(ctx context.Context, id int64) (User, error) {
	u, err := s.q.GetUser(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, fmt.Errorf("%w: user %d", apperr.ErrNotFound, id)
	}
	return toUser(u), err
}

func (s *Service) GetUserByUsername(ctx context.Context, username string) (User, error) {
	u, err := s.q.GetUserByUsername(ctx, username)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, fmt.Errorf("%w: user %q", apperr.ErrNotFound, username)
	}
	return toUser(u), err
}

func (s *Service) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := s.q.ListUsers(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]User, len(rows))
	for i, u := range rows {
		out[i] = toUser(u)
	}
	return out, nil
}

// Authenticate checks a username/password pair. Unknown users and wrong
// passwords take the same time and return the same error.
func (s *Service) Authenticate(ctx context.Context, username, password string) (User, error) {
	u, err := s.q.GetUserByUsername(ctx, username)
	if errors.Is(err, pgx.ErrNoRows) {
		_, _ = argon2id.ComparePasswordAndHash(password, dummyHash())
		return User{}, apperr.ErrUnauthorized
	}
	if err != nil {
		return User{}, err
	}
	ok, err := argon2id.ComparePasswordAndHash(password, u.PasswordHash)
	if err != nil {
		return User{}, err
	}
	if !ok || u.Disabled {
		return User{}, apperr.ErrUnauthorized
	}
	return toUser(u), nil
}

type UserUpdate struct {
	Role     *access.Role
	Disabled *bool
	Password *string
}

func (s *Service) UpdateUser(ctx context.Context, id int64, upd UserUpdate) (User, error) {
	params := sqlc.UpdateUserParams{ID: id, Disabled: upd.Disabled}
	if upd.Role != nil {
		r := string(*upd.Role)
		params.Role = &r
	}
	if upd.Password != nil {
		hash, err := hashPassword(*upd.Password)
		if err != nil {
			return User{}, err
		}
		params.PasswordHash = &hash
	}
	u, err := s.q.UpdateUser(ctx, params)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, fmt.Errorf("%w: user %d", apperr.ErrNotFound, id)
	}
	return toUser(u), err
}

func (s *Service) ChangePassword(ctx context.Context, userID int64, current, next string) error {
	u, err := s.q.GetUser(ctx, userID)
	if err != nil {
		return err
	}
	ok, err := argon2id.ComparePasswordAndHash(current, u.PasswordHash)
	if err != nil {
		return err
	}
	if !ok {
		return fmt.Errorf("%w: current password is wrong", apperr.ErrForbidden)
	}
	_, err = s.UpdateUser(ctx, userID, UserUpdate{Password: &next})
	return err
}

func hashPassword(password string) (string, error) {
	if len(password) < minPasswordLength {
		return "", fmt.Errorf("%w: password must be at least %d characters", apperr.ErrInvalid, minPasswordLength)
	}
	return argon2id.CreateHash(password, argon2id.DefaultParams)
}

var dummyHash = sync.OnceValue(func() string {
	h, _ := argon2id.CreateHash("timing-equalisation", argon2id.DefaultParams)
	return h
})

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

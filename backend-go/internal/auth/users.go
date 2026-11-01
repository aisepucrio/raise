// Package auth implements local accounts: users with roles, cookie sessions
// for the frontend (scs, stored in Postgres) and personal API keys for
// scripted access. Both resolve to an access.Principal.
package auth

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"runtime"
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
	ID         int64       `json:"id"`
	Username   string      `json:"username"`
	Role       access.Role `json:"role" enum:"viewer,researcher,admin"`
	IsDisabled bool        `json:"is_disabled"`
	CreatedAt  time.Time   `json:"created_at"`

	sessionVersion int32 // never serialised; see startSession
}

func toUser(u sqlc.User) User {
	return User{ID: u.ID, Username: u.Username, Role: access.Role(u.Role), IsDisabled: u.IsDisabled, CreatedAt: u.CreatedAt, sessionVersion: u.SessionVersion}
}

type Service struct {
	pool     *pgxpool.Pool
	q        *sqlc.Queries
	sessions *scs.SessionManager
	limiter  *loginLimiter
	// hashSlots bounds concurrent argon2id computations, so a flood of logins
	// queues instead of exhausting memory.
	hashSlots chan struct{}
}

// NewService builds the auth service. sessions may be nil for CLI use.
func NewService(pool *pgxpool.Pool, sessions *scs.SessionManager) *Service {
	return &Service{
		pool: pool, q: sqlc.New(pool), sessions: sessions, limiter: newLoginLimiter(),
		hashSlots: make(chan struct{}, runtime.NumCPU()),
	}
}

func (s *Service) CreateUser(ctx context.Context, username, password string, role access.Role) (User, error) {
	if err := validateUsername(username); err != nil {
		return User{}, err
	}
	hash, err := s.hashPassword(ctx, password)
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

// BootstrapAdmin creates the first admin on a fresh installation, from
// configuration, so the web interface can be logged into without raisectl.
// It does nothing when username is empty or any user already exists, so
// changing the configured password later has no effect. Concurrent API
// processes may race: the loser's insert conflicts and is not an error.
func (s *Service) BootstrapAdmin(ctx context.Context, username, password string) (bool, error) {
	if username == "" {
		return false, nil
	}
	exists, err := s.q.HasUsers(ctx)
	if err != nil || exists {
		return false, err
	}
	_, err = s.CreateUser(ctx, username, password, access.Admin)
	if errors.Is(err, apperr.ErrConflict) {
		return false, nil
	}
	return err == nil, err
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
		_, _ = s.comparePassword(ctx, password, dummyHash())
		return User{}, apperr.ErrUnauthorized
	}
	if err != nil {
		return User{}, err
	}
	ok, err := s.comparePassword(ctx, password, u.PasswordHash)
	if err != nil {
		return User{}, err
	}
	if !ok || u.IsDisabled {
		return User{}, apperr.ErrUnauthorized
	}
	return toUser(u), nil
}

type UserUpdate struct {
	Username   *string
	Role       *access.Role
	IsDisabled *bool
	Password   *string
}

// UpdateUser changes the given fields. A new password also ends the user's
// sessions (their session_version moves on) and revokes their API keys, so
// resetting a compromised account locks out whoever holds them.
func (s *Service) UpdateUser(ctx context.Context, id int64, upd UserUpdate) (User, error) {
	params := sqlc.UpdateUserParams{ID: id, Username: upd.Username, IsDisabled: upd.IsDisabled}
	if upd.Username != nil {
		if err := validateUsername(*upd.Username); err != nil {
			return User{}, err
		}
	}
	if upd.Role != nil {
		r := string(*upd.Role)
		params.Role = &r
	}
	if upd.Password != nil {
		hash, err := s.hashPassword(ctx, *upd.Password)
		if err != nil {
			return User{}, err
		}
		params.PasswordHash = &hash
	}

	var u sqlc.User
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		q := s.q.WithTx(tx)
		var err error
		if u, err = q.UpdateUser(ctx, params); err != nil {
			return err
		}
		if upd.Password != nil {
			return q.RevokeUserAPIKeys(ctx, id)
		}
		return nil
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, fmt.Errorf("%w: user %d", apperr.ErrNotFound, id)
	}
	if isUniqueViolation(err) {
		return User{}, fmt.Errorf("%w: username %q is taken", apperr.ErrConflict, *upd.Username)
	}
	return toUser(u), err
}

// DeleteUser removes an account. Its API keys go with it (cascade), its
// sessions stop resolving, and the credentials and collections it created
// keep their data with created_by set to NULL.
func (s *Service) DeleteUser(ctx context.Context, id int64) error {
	n, err := s.q.DeleteUser(ctx, id)
	if err != nil {
		return err
	}
	if n == 0 {
		return fmt.Errorf("%w: user %d", apperr.ErrNotFound, id)
	}
	return nil
}

// ChangePassword sets a user's own password after checking the current one.
// Like any new password, it ends the user's sessions and revokes their API
// keys; the caller starts a new session for the user's current client.
func (s *Service) ChangePassword(ctx context.Context, userID int64, current, next string) (User, error) {
	u, err := s.q.GetUser(ctx, userID)
	if err != nil {
		return User{}, err
	}
	ok, err := s.comparePassword(ctx, current, u.PasswordHash)
	if err != nil {
		return User{}, err
	}
	if !ok {
		return User{}, fmt.Errorf("%w: current password is wrong", apperr.ErrForbidden)
	}
	return s.UpdateUser(ctx, userID, UserUpdate{Password: &next})
}

func validateUsername(username string) error {
	if !usernameRE.MatchString(username) {
		return fmt.Errorf("%w: username must be 2-64 characters of letters, digits, '.', '_' or '-'", apperr.ErrInvalid)
	}
	return nil
}

// argon2Params is OWASP's recommended argon2id configuration: 19 MiB, two
// passes, one lane. With hashSlots, hashing never holds more than
// NumCPU × 19 MiB, whatever the request rate. Existing hashes keep the
// parameters encoded in them.
var argon2Params = &argon2id.Params{Memory: 19 * 1024, Iterations: 2, Parallelism: 1, SaltLength: 16, KeyLength: 32}

func (s *Service) hashPassword(ctx context.Context, password string) (string, error) {
	if len(password) < minPasswordLength {
		return "", fmt.Errorf("%w: password must be at least %d characters", apperr.ErrInvalid, minPasswordLength)
	}
	release, err := s.acquireHashSlot(ctx)
	if err != nil {
		return "", err
	}
	defer release()
	return argon2id.CreateHash(password, argon2Params)
}

func (s *Service) comparePassword(ctx context.Context, password, hash string) (bool, error) {
	release, err := s.acquireHashSlot(ctx)
	if err != nil {
		return false, err
	}
	defer release()
	return argon2id.ComparePasswordAndHash(password, hash)
}

func (s *Service) acquireHashSlot(ctx context.Context) (func(), error) {
	select {
	case s.hashSlots <- struct{}{}:
		return func() { <-s.hashSlots }, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

var dummyHash = sync.OnceValue(func() string {
	h, _ := argon2id.CreateHash("timing-equalisation", argon2Params)
	return h
})

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

package auth

import (
	"context"
	"net/http"
	"time"

	"github.com/alexedwards/scs/pgxstore"
	"github.com/alexedwards/scs/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"raise/internal/httpapi"
)

const (
	sessionUserKey    = "user_id"
	sessionVersionKey = "session_version" // users.session_version at login
)

// NewSessionManager returns an scs session manager backed by the sessions
// table. secure should be true whenever the app is served over HTTPS.
func NewSessionManager(pool *pgxpool.Pool, secure bool) *scs.SessionManager {
	sm := scs.New()
	sm.Store = pgxstore.New(pool)
	sm.Lifetime = 7 * 24 * time.Hour
	sm.IdleTimeout = 24 * time.Hour
	sm.Cookie.Name = httpapi.SessionCookie
	sm.Cookie.HttpOnly = true
	sm.Cookie.SameSite = http.SameSiteLaxMode
	sm.Cookie.Secure = secure
	sm.Cookie.Path = "/"
	return sm
}

// startSession logs u in on the current client. A new token on every
// privilege change prevents session fixation.
func (s *Service) startSession(ctx context.Context, u User) error {
	if err := s.sessions.RenewToken(ctx); err != nil {
		return err
	}
	s.sessions.Put(ctx, sessionUserKey, u.ID)
	s.sessions.Put(ctx, sessionVersionKey, u.sessionVersion)
	return nil
}

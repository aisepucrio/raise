package auth

import (
	"errors"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5"

	"raise/internal/access"
)

// Values of access.Principal.Via.
const (
	viaSession = "session"
	viaAPIKey  = "api_key"
)

// ResolvePrincipal authenticates the request from an API key (Authorization:
// Bearer rk_...) or the session cookie, and stores the Principal in the
// context. It never rejects anonymous requests; RequireRole does that per
// operation. Must run after the session manager's LoadAndSave.
func (s *Service) ResolvePrincipal(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		if token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer "); ok {
			row, err := s.q.UseAPIKey(ctx, hashToken(token))
			if errors.Is(err, pgx.ErrNoRows) {
				http.Error(w, `{"title":"Unauthorized","status":401,"detail":"invalid API key"}`, http.StatusUnauthorized)
				return
			}
			if err != nil {
				http.Error(w, "internal error", http.StatusInternalServerError)
				return
			}
			p := access.Principal{UserID: row.ID, Username: row.Username, Role: access.Role(row.Role), Via: viaAPIKey}
			next.ServeHTTP(w, r.WithContext(access.WithPrincipal(ctx, p)))
			return
		}

		// Users are re-read on every request so that disabling an account,
		// changing a role or setting a new password (which bumps
		// session_version) takes effect immediately for existing sessions.
		if id := s.sessions.GetInt64(ctx, sessionUserKey); id != 0 {
			u, err := s.q.GetUser(ctx, id)
			if err == nil && !u.IsDisabled && s.sessions.GetInt32(ctx, sessionVersionKey) == u.SessionVersion {
				p := access.Principal{UserID: u.ID, Username: u.Username, Role: access.Role(u.Role), Via: viaSession}
				ctx = access.WithPrincipal(ctx, p)
			}
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole enforces the role declared in each operation's metadata (see
// access.Require). Operations without metadata require Viewer.
func RequireRole(api huma.API) func(huma.Context, func(huma.Context)) {
	return func(ctx huma.Context, next func(huma.Context)) {
		role, public := access.RequiredRole(ctx.Operation())
		if public {
			next(ctx)
			return
		}
		p, ok := access.FromContext(ctx.Context())
		if !ok {
			_ = huma.WriteErr(api, ctx, http.StatusUnauthorized, "authentication required")
			return
		}
		if !p.Role.Allows(role) {
			_ = huma.WriteErr(api, ctx, http.StatusForbidden, "requires role "+string(role))
			return
		}
		next(ctx)
	}
}

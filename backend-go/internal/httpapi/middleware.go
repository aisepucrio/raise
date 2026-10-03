package httpapi

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5/middleware"
)

// Standard returns the cross-cutting middleware every request goes through.
// trustProxy enables X-Forwarded-For handling; only set it behind nginx.
func Standard(logger *slog.Logger, trustProxy bool) []func(http.Handler) http.Handler {
	return []func(http.Handler) http.Handler{
		middleware.RequestID,
		clientIP(trustProxy),
		requestLogger(logger),
		middleware.Recoverer,
		// Rejects cross-origin state-changing browser requests (CSRF). Non-browser
		// clients (scripts with API keys) send no Origin/Sec-Fetch-Site and pass.
		http.NewCrossOriginProtection().Handler,
	}
}

type clientIPKey struct{}

// clientIP records the caller's address. Behind a trusted reverse proxy the
// last X-Forwarded-For entry is used: it is the one appended by the proxy
// itself, whereas earlier entries are client-controlled and can be spoofed.
func clientIP(trustProxy bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				ip = r.RemoteAddr
			}
			if xff := r.Header.Values("X-Forwarded-For"); trustProxy && len(xff) > 0 {
				hops := strings.Split(xff[len(xff)-1], ",")
				if last := strings.TrimSpace(hops[len(hops)-1]); last != "" {
					ip = last
				}
			}
			next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), clientIPKey{}, ip)))
		})
	}
}

// ClientIP returns the caller's IP address.
func ClientIP(ctx context.Context) string {
	ip, _ := ctx.Value(clientIPKey{}).(string)
	return ip
}

func requestLogger(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
			next.ServeHTTP(ww, r)
			logger.Info("request",
				"method", r.Method,
				"path", r.URL.Path,
				"status", ww.Status(),
				"duration", time.Since(start),
				"request_id", middleware.GetReqID(r.Context()),
			)
		})
	}
}

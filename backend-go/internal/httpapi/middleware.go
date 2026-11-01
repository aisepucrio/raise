package httpapi

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"net/netip"
	"strings"
	"time"

	"github.com/go-chi/chi/v5/middleware"
)

// Standard returns the cross-cutting middleware every request goes through.
// X-Forwarded-For is only read from the trusted proxies (see clientIP).
func Standard(logger *slog.Logger, trustedProxies []netip.Prefix) []func(http.Handler) http.Handler {
	return []func(http.Handler) http.Handler{
		middleware.RequestID,
		clientIP(trustedProxies),
		requestLogger(logger),
		middleware.Recoverer,
		// Rejects cross-origin state-changing browser requests (CSRF). Non-browser
		// clients (scripts with API keys) send no Origin/Sec-Fetch-Site and pass.
		http.NewCrossOriginProtection().Handler,
	}
}

// ParseTrustedProxies parses TRUSTED_PROXIES entries: addresses ("10.0.0.5")
// or networks ("172.16.0.0/12").
func ParseTrustedProxies(entries []string) ([]netip.Prefix, error) {
	var out []netip.Prefix
	for _, e := range entries {
		e = strings.TrimSpace(e)
		if e == "" {
			continue
		}
		if !strings.Contains(e, "/") {
			addr, err := netip.ParseAddr(e)
			if err != nil {
				return nil, fmt.Errorf("trusted proxy %q: %w", e, err)
			}
			out = append(out, netip.PrefixFrom(addr.Unmap(), addr.Unmap().BitLen()))
			continue
		}
		p, err := netip.ParsePrefix(e)
		if err != nil {
			return nil, fmt.Errorf("trusted proxy %q: %w", e, err)
		}
		out = append(out, p.Masked())
	}
	return out, nil
}

type clientIPKey struct{}

// clientIP records the caller's address. A request from a trusted proxy
// carries the client's address in X-Forwarded-For, where each proxy appends
// the address it received the request from. Walking the list from the end, the
// first address that isn't a trusted proxy is the client; anything before it
// was written by the client and can be spoofed. Requests from anywhere else
// are taken at face value, so connecting to the API directly can't forge an
// address.
func clientIP(trusted []netip.Prefix) func(http.Handler) http.Handler {
	isTrusted := func(a netip.Addr) bool {
		for _, p := range trusted {
			if p.Contains(a) {
				return true
			}
		}
		return false
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr
			if ap, err := netip.ParseAddrPort(r.RemoteAddr); err == nil {
				ip = ap.Addr().Unmap().String()
				if addr := ap.Addr().Unmap(); isTrusted(addr) {
					hops := strings.Split(strings.Join(r.Header.Values("X-Forwarded-For"), ","), ",")
					for i := len(hops) - 1; i >= 0 && isTrusted(addr); i-- {
						hop, err := netip.ParseAddr(strings.TrimSpace(hops[i]))
						if err != nil {
							break // keep the last address a trusted proxy vouched for
						}
						addr = hop.Unmap()
					}
					ip = addr.String()
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

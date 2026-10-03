package auth

import (
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// loginLimiter throttles login attempts per (client IP, username). It is in
// memory, which is enough while there is a single API process.
type loginLimiter struct {
	mu      sync.Mutex
	entries map[string]*limiterEntry
}

type limiterEntry struct {
	lim  *rate.Limiter
	seen time.Time
}

const (
	loginBurst    = 5
	loginInterval = 12 * time.Second // refills to 5 attempts per minute
	maxEntries    = 10_000
)

func newLoginLimiter() *loginLimiter {
	return &loginLimiter{entries: map[string]*limiterEntry{}}
}

func (l *loginLimiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	if len(l.entries) >= maxEntries {
		for k, e := range l.entries {
			if now.Sub(e.seen) > time.Hour {
				delete(l.entries, k)
			}
		}
	}
	e, ok := l.entries[key]
	if !ok {
		e = &limiterEntry{lim: rate.NewLimiter(rate.Every(loginInterval), loginBurst)}
		l.entries[key] = e
	}
	e.seen = now
	return e.lim.Allow()
}

package auth

import (
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// loginLimiter throttles login attempts at two levels: per (client IP,
// username), against guessing one account's password, and per client IP,
// against spraying passwords over many usernames, which also bounds the
// argon2id work one client can cause. It is in memory, which is enough while
// there is a single API process.
type loginLimiter struct {
	ip   *keyedLimiter
	pair *keyedLimiter
}

const (
	pairBurst    = 5
	pairInterval = 12 * time.Second // refills to 5 attempts per minute
	ipBurst      = 20
	ipInterval   = 3 * time.Second // refills to 20 attempts per minute
	maxEntries   = 10_000
)

func newLoginLimiter() *loginLimiter {
	return &loginLimiter{
		ip:   newKeyedLimiter(ipInterval, ipBurst),
		pair: newKeyedLimiter(pairInterval, pairBurst),
	}
}

func (l *loginLimiter) Allow(ip, username string) bool {
	now := time.Now()
	return l.ip.allow(ip, now) && l.pair.allow(ip+"|"+strings.ToLower(username), now)
}

// keyedLimiter is a token bucket per key, with at most maxEntries keys.
type keyedLimiter struct {
	mu        sync.Mutex
	every     time.Duration
	burst     int
	entries   map[string]*limiterEntry
	lastSweep time.Time
}

type limiterEntry struct {
	lim  *rate.Limiter
	seen time.Time
}

func newKeyedLimiter(every time.Duration, burst int) *keyedLimiter {
	return &keyedLimiter{every: every, burst: burst, entries: map[string]*limiterEntry{}}
}

// allow takes a token from key's bucket. When the table is full and nothing
// can be evicted, new keys are refused rather than letting memory grow: known
// keys keep working, and the table frees up as soon as its entries go idle.
func (l *keyedLimiter) allow(key string, now time.Time) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	e, ok := l.entries[key]
	if !ok {
		if len(l.entries) >= maxEntries && !l.sweep(now) {
			return false
		}
		e = &limiterEntry{lim: rate.NewLimiter(rate.Every(l.every), l.burst)}
		l.entries[key] = e
	}
	e.seen = now
	return e.lim.AllowN(now, 1)
}

// sweep drops the entries idle long enough for their bucket to be full again,
// so forgetting them changes nothing. It scans at most once a second, so a
// full table can't make every request walk it. It reports whether there is
// room for a new entry.
func (l *keyedLimiter) sweep(now time.Time) bool {
	if now.Sub(l.lastSweep) >= time.Second {
		l.lastSweep = now
		refill := l.every * time.Duration(l.burst)
		for k, e := range l.entries {
			if now.Sub(e.seen) >= refill {
				delete(l.entries, k)
			}
		}
	}
	return len(l.entries) < maxEntries
}

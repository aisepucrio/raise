package auth

import (
	"fmt"
	"testing"
	"time"
)

func TestLoginLimiterPerUsernameAndPerIP(t *testing.T) {
	l := newLoginLimiter()
	for i := range pairBurst {
		if !l.Allow("1.1.1.1", "Alice") {
			t.Fatalf("attempt %d for alice refused", i+1)
		}
	}
	if l.Allow("1.1.1.1", "alice") {
		t.Fatal("6th attempt for alice allowed (usernames are case-insensitive)")
	}
	if !l.Allow("2.2.2.2", "alice") {
		t.Fatal("another IP was throttled for alice")
	}

	// Spraying: a fresh username every time still runs into the per-IP limit.
	sprayed := 0
	for i := range 100 {
		if l.Allow("3.3.3.3", fmt.Sprintf("user%d", i)) {
			sprayed++
		}
	}
	if sprayed != ipBurst {
		t.Fatalf("one IP got %d attempts across usernames, want %d", sprayed, ipBurst)
	}
}

func TestKeyedLimiterIsBounded(t *testing.T) {
	l := newKeyedLimiter(time.Second, 1)
	now := time.Now()
	for i := range maxEntries {
		l.allow(fmt.Sprint(i), now)
	}
	if l.allow("new", now) {
		t.Fatal("a new key was admitted to a full table of active keys")
	}
	if !l.allow("0", now.Add(2*time.Second)) {
		t.Fatal("a known key was refused after its bucket refilled")
	}
	// Once the entries are idle for a full refill, they are evicted.
	if !l.allow("new", now.Add(3*time.Second)) {
		t.Fatal("a new key was refused after the table went idle")
	}
	if len(l.entries) > 2 {
		t.Fatalf("%d entries left after the sweep, want at most 2", len(l.entries))
	}
}

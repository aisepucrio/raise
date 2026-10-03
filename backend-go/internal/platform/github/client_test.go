package github

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"raise/internal/jobkit"
	"raise/internal/platform"
)

type fakeLease struct {
	id          int64
	reported    []platform.Quota
	invalidated bool
}

func (l *fakeLease) Credential() platform.Credential {
	return platform.Credential{ID: l.id, Secret: map[string]string{"token": "t" + strconv.FormatInt(l.id, 10)}}
}
func (l *fakeLease) Report(_ context.Context, q platform.Quota) error {
	l.reported = append(l.reported, q)
	return nil
}
func (l *fakeLease) Invalidate(context.Context, string) error { l.invalidated = true; return nil }

type fakeLeaser struct{ leases []*fakeLease }

func (f *fakeLeaser) Lease(context.Context, platform.ID, string) (platform.Lease, error) {
	l := &fakeLease{id: int64(len(f.leases) + 1)}
	f.leases = append(f.leases, l)
	return l, nil
}

func TestClientRotatesOnRejectedAndExhaustedTokens(t *testing.T) {
	reset := time.Now().Add(time.Hour).Unix()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-RateLimit-Limit", "5000")
		w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(reset, 10))
		w.Header().Set("X-RateLimit-Resource", "core")
		switch r.Header.Get("Authorization") {
		case "Bearer t1":
			w.Header().Set("X-RateLimit-Remaining", "10")
			w.WriteHeader(http.StatusUnauthorized)
		case "Bearer t2":
			w.Header().Set("X-RateLimit-Remaining", "0")
			w.WriteHeader(http.StatusForbidden)
		default:
			w.Header().Set("X-RateLimit-Remaining", "4999")
			w.Header().Set("Link", `<https://api.github.com/x?page=2>; rel="next", <https://api.github.com/x?page=7>; rel="last"`)
			_, _ = w.Write([]byte(`[{"number": 1}]`))
		}
	}))
	defer srv.Close()

	leaser := &fakeLeaser{}
	c := NewClient(srv.Client(), srv.URL, leaser)
	var out []map[string]any
	page, err := c.Get(context.Background(), ScopeCore, "/repos/a/b/issues", nil, &out)
	if err != nil {
		t.Fatal(err)
	}
	if page.Next != 2 || page.Last != 7 || len(out) != 1 {
		t.Fatalf("page=%+v out=%v", page, out)
	}
	if len(leaser.leases) != 3 || !leaser.leases[0].invalidated || leaser.leases[1].invalidated {
		t.Fatalf("unexpected lease usage: %+v", leaser.leases)
	}
	if q := leaser.leases[2].reported[0]; q.Remaining != 4999 || q.Scope != "core" {
		t.Fatalf("reported quota = %+v", q)
	}
}

func TestClientSecondaryRateLimitSnoozes(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Retry-After", "60")
		w.WriteHeader(http.StatusForbidden)
	}))
	defer srv.Close()

	c := NewClient(srv.Client(), srv.URL, &fakeLeaser{})
	_, err := c.Get(context.Background(), ScopeCore, "/x", nil, &struct{}{})
	var rl *jobkit.RateLimitedError
	if !errors.As(err, &rl) || time.Until(rl.ResetAt) < 50*time.Second {
		t.Fatalf("err = %v, want RateLimitedError ~60s", err)
	}
}

func TestClientNotFoundIsPermanent(t *testing.T) {
	srv := httptest.NewServer(http.NotFoundHandler())
	defer srv.Close()

	c := NewClient(srv.Client(), srv.URL, &fakeLeaser{})
	_, err := c.Get(context.Background(), ScopeCore, "/x", nil, &struct{}{})
	if !errors.Is(err, jobkit.ErrPermanent) {
		t.Fatalf("err = %v, want ErrPermanent", err)
	}
}

func TestMatchRemote(t *testing.T) {
	p := &Platform{cfg: Config{Hosts: []string{"github.com"}}}
	if ref, ok := p.MatchRemote("github.com", "golang/go"); !ok || ref.Owner != "golang" || ref.Name != "go" {
		t.Errorf("MatchRemote = %+v, %v", ref, ok)
	}
	for _, c := range [][2]string{{"gitlab.com", "a/b"}, {"github.com", "a/b/c"}, {"github.com", "a"}} {
		if _, ok := p.MatchRemote(c[0], c[1]); ok {
			t.Errorf("MatchRemote(%q, %q) should not match", c[0], c[1])
		}
	}
}

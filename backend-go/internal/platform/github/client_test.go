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

type fakeLeaser struct {
	leases []*fakeLease
	scopes []string
}

func (f *fakeLeaser) Lease(_ context.Context, _ platform.ID, scope string) (platform.Lease, error) {
	l := &fakeLease{id: int64(len(f.leases) + 1)}
	f.leases = append(f.leases, l)
	f.scopes = append(f.scopes, scope)
	return l, nil
}

// graphqlServer answers every request with handler, after checking it is a
// GraphQL POST.
func graphqlServer(t *testing.T, handler http.HandlerFunc) *Client {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/graphql" {
			t.Errorf("unexpected request %s %s", r.Method, r.URL.Path)
		}
		handler(w, r)
	}))
	t.Cleanup(srv.Close)
	return NewClient(srv.Client(), srv.URL, srv.URL+"/graphql", &fakeLeaser{})
}

func quotaHeaders(w http.ResponseWriter, remaining int) {
	w.Header().Set("X-RateLimit-Limit", "5000")
	w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
	w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(time.Hour).Unix(), 10))
	w.Header().Set("X-RateLimit-Resource", "graphql")
}

func TestQueryRotatesOnRejectedAndExhaustedTokens(t *testing.T) {
	c := graphqlServer(t, func(w http.ResponseWriter, r *http.Request) {
		switch r.Header.Get("Authorization") {
		case "Bearer t1":
			quotaHeaders(w, 10)
			w.WriteHeader(http.StatusUnauthorized)
		case "Bearer t2":
			// Primary GraphQL limit: HTTP 200 with a RATE_LIMITED error.
			quotaHeaders(w, 0)
			_, _ = w.Write([]byte(`{"data": null, "errors": [{"type": "RATE_LIMITED", "message": "API rate limit exceeded"}]}`))
		default:
			quotaHeaders(w, 4990)
			_, _ = w.Write([]byte(`{"data": {"viewer": {"login": "octocat"}}}`))
		}
	})
	leaser := c.leaser.(*fakeLeaser)

	var out struct {
		Viewer struct{ Login string } `json:"viewer"`
	}
	if err := c.Query(context.Background(), "{ viewer { login } }", nil, &out); err != nil {
		t.Fatal(err)
	}
	if out.Viewer.Login != "octocat" {
		t.Fatalf("out = %+v", out)
	}
	if len(leaser.leases) != 3 || !leaser.leases[0].invalidated || leaser.leases[1].invalidated {
		t.Fatalf("unexpected lease usage: %+v", leaser.leases)
	}
	if leaser.scopes[0] != ScopeGraphQL {
		t.Fatalf("leased scope %q, want %q", leaser.scopes[0], ScopeGraphQL)
	}
	if q := leaser.leases[2].reported[0]; q.RequestsRemaining != 4990 || q.Scope != ScopeGraphQL {
		t.Fatalf("reported quota = %+v", q)
	}
}

func TestQuerySecondaryRateLimitSnoozes(t *testing.T) {
	for name, h := range map[string]http.HandlerFunc{
		"retry-after": func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusForbidden)
		},
		"message only": func(w http.ResponseWriter, _ *http.Request) {
			quotaHeaders(w, 4000)
			w.WriteHeader(http.StatusForbidden)
			_, _ = w.Write([]byte(`{"message": "You have exceeded a secondary rate limit."}`))
		},
		"graphql error": func(w http.ResponseWriter, _ *http.Request) {
			quotaHeaders(w, 4000)
			_, _ = w.Write([]byte(`{"errors": [{"type": "RATE_LIMITED", "message": "secondary"}]}`))
		},
	} {
		t.Run(name, func(t *testing.T) {
			err := graphqlServer(t, h).Query(context.Background(), "{}", nil, &struct{}{})
			var rl *jobkit.RateLimitedError
			if !errors.As(err, &rl) || time.Until(rl.ResetAt) < 50*time.Second {
				t.Fatalf("err = %v, want RateLimitedError ~60s", err)
			}
		})
	}
}

func TestQueryToleratesPartialNotFound(t *testing.T) {
	c := graphqlServer(t, func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"data": {"nodes": [null, {"id": "I_2"}]},
			"errors": [{"type": "NOT_FOUND", "path": ["nodes", 0], "message": "Could not resolve to a node"}]}`))
	})
	var out struct {
		Nodes []*struct{ ID string } `json:"nodes"`
	}
	if err := c.Query(context.Background(), "{}", nil, &out); err != nil {
		t.Fatal(err)
	}
	if len(out.Nodes) != 2 || out.Nodes[0] != nil || out.Nodes[1].ID != "I_2" {
		t.Fatalf("out = %+v", out)
	}
}

func TestQueryErrorClassification(t *testing.T) {
	cases := map[string]struct {
		status int
		body   string
		want   error
	}{
		"gateway timeout": {http.StatusBadGateway, ``, ErrQueryTimeout},
		"query timeout": {http.StatusOK, `{"data": null, "errors": [{"message": "Something went wrong while executing your query. This may be the result of a timeout, or it could be a GitHub bug."}]}`,
			ErrQueryTimeout},
		"forbidden":     {http.StatusOK, `{"data": {"repository": null}, "errors": [{"type": "FORBIDDEN", "path": ["repository"], "message": "SAML enforcement"}]}`, jobkit.ErrPermanent},
		"forbidden 403": {http.StatusForbidden, `{"message": "Resource not accessible"}`, jobkit.ErrPermanent},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			c := graphqlServer(t, func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(tc.status)
				_, _ = w.Write([]byte(tc.body))
			})
			if err := c.Query(context.Background(), "{}", nil, &struct{}{}); !errors.Is(err, tc.want) {
				t.Fatalf("err = %v, want %v", err, tc.want)
			}
		})
	}

	t.Run("invalid query is retryable", func(t *testing.T) {
		c := graphqlServer(t, func(w http.ResponseWriter, _ *http.Request) {
			_, _ = w.Write([]byte(`{"errors": [{"message": "Field 'x' doesn't exist on type 'Query'"}]}`))
		})
		err := c.Query(context.Background(), "{ x }", nil, &struct{}{})
		var gerr *GraphQLError
		if !errors.As(err, &gerr) || errors.Is(err, jobkit.ErrPermanent) {
			t.Fatalf("err = %v, want a non-permanent GraphQLError", err)
		}
	})
}

func TestGraphQLURLFor(t *testing.T) {
	for in, want := range map[string]string{
		"https://api.github.com":              "https://api.github.com/graphql",
		"https://api.github.com/":             "https://api.github.com/graphql",
		"https://github.example.com/api/v3":   "https://github.example.com/api/graphql",
		"https://github.example.com/api/v3/":  "https://github.example.com/api/graphql",
		"http://localhost:8080/custom-prefix": "http://localhost:8080/custom-prefix/graphql",
	} {
		if got := graphqlURLFor(in); got != want {
			t.Errorf("graphqlURLFor(%q) = %q, want %q", in, got, want)
		}
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

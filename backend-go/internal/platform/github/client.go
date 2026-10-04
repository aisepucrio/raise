package github

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"raise/internal/jobkit"
	"raise/internal/platform"
)

// Rate-limit scopes ("resources" in GitHub's terms). Mining uses the GraphQL
// API, whose quota is measured in points per hour; REST is only used for
// credential tests and cloning.
const (
	ScopeCore    = "core"
	ScopeGraphQL = "graphql"
)

// maxLeaseAttempts bounds how many credentials one request tries before
// giving up (each 401 or exhausted quota moves on to the next credential).
const maxLeaseAttempts = 3

// secondaryLimitWait is how long to back off from a secondary rate limit that
// doesn't say when to retry (GitHub recommends at least a minute).
const secondaryLimitWait = time.Minute

var errRetryCredential = errors.New("retry with another credential")

// ErrQueryTimeout means GitHub gave up executing a query (its limit is 10s).
// Retrying the same query may work; a smaller one is more likely to.
var ErrQueryTimeout = errors.New("GitHub query timed out")

// Client is a GitHub GraphQL client that leases a credential per request from
// the pool and feeds observed rate limits back into it.
type Client struct {
	http       *http.Client
	restURL    string
	graphqlURL string
	leaser     platform.Leaser
}

func NewClient(hc *http.Client, restURL, graphqlURL string, leaser platform.Leaser) *Client {
	return &Client{http: hc, restURL: restURL, graphqlURL: graphqlURL, leaser: leaser}
}

// graphqlURLFor derives the GraphQL endpoint from the REST base URL:
// https://api.github.com → /graphql; GitHub Enterprise's https://host/api/v3
// → https://host/api/graphql.
func graphqlURLFor(restURL string) string {
	restURL = strings.TrimSuffix(restURL, "/")
	if base, ok := strings.CutSuffix(restURL, "/v3"); ok {
		return base + "/graphql"
	}
	return restURL + "/graphql"
}

type gqlError struct {
	Type    string `json:"type"`
	Message string `json:"message"`
	Path    []any  `json:"path"`
}

// GraphQLError is a response whose errors array couldn't be tolerated.
type GraphQLError struct{ Errors []gqlError }

func (e *GraphQLError) Error() string {
	msgs := make([]string, len(e.Errors))
	for i, ge := range e.Errors {
		msgs[i] = ge.Message
		if ge.Type != "" {
			msgs[i] = ge.Type + ": " + ge.Message
		}
	}
	return "GitHub GraphQL: " + strings.Join(msgs, "; ")
}

// Query runs a GraphQL query and decodes its data into out.
//
// NOT_FOUND errors on part of the response (a deleted issue in a nodes(ids:)
// batch, a missing repository) are tolerated: the affected fields are null in
// out and callers decide what that means.
func (c *Client) Query(ctx context.Context, query string, vars map[string]any, out any) error {
	body, err := json.Marshal(map[string]any{"query": query, "variables": vars})
	if err != nil {
		return err
	}
	var lastErr error
	for range maxLeaseAttempts {
		lease, err := c.leaser.Lease(ctx, ID, ScopeGraphQL)
		if err != nil {
			return err
		}
		err = c.query(ctx, lease, body, out)
		if !errors.Is(err, errRetryCredential) {
			return err
		}
		lastErr = err
	}
	return lastErr
}

func (c *Client) query(ctx context.Context, lease platform.Lease, body []byte, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.graphqlURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	setHeaders(req, lease.Credential().Field("token"))
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	quota, hasQuota := parseQuota(resp.Header, ScopeGraphQL)
	if hasQuota {
		_ = lease.Report(ctx, quota)
	}
	exhausted := hasQuota && quota.RequestsRemaining == 0
	credID := lease.Credential().ID

	switch {
	case resp.StatusCode == http.StatusUnauthorized:
		_ = lease.Invalidate(ctx, "rejected by GitHub (401)")
		return fmt.Errorf("credential %d: %w", credID, errRetryCredential)
	case resp.StatusCode == http.StatusForbidden || resp.StatusCode == http.StatusTooManyRequests:
		msg, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		if rl := secondaryLimit(resp.Header, msg); rl != nil {
			return rl
		}
		if exhausted {
			return fmt.Errorf("credential %d exhausted: %w", credID, errRetryCredential)
		}
		return fmt.Errorf("%w: GitHub returned %s: %s", jobkit.ErrPermanent, resp.Status, msg)
	case resp.StatusCode == http.StatusBadGateway || resp.StatusCode == http.StatusGatewayTimeout:
		return fmt.Errorf("%w (%s)", ErrQueryTimeout, resp.Status)
	case resp.StatusCode >= 400:
		return fmt.Errorf("unexpected response from GitHub: %s", resp.Status)
	}

	var envelope struct {
		Data   json.RawMessage `json:"data"`
		Errors []gqlError      `json:"errors"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return fmt.Errorf("decode GraphQL response: %w", err)
	}
	if err := classifyErrors(envelope.Errors, exhausted, resp.Header, credID); err != nil {
		return err
	}
	if len(envelope.Data) == 0 || string(envelope.Data) == "null" {
		return errors.New("GitHub GraphQL: response has no data")
	}
	if err := json.Unmarshal(envelope.Data, out); err != nil {
		return fmt.Errorf("decode GraphQL data: %w", err)
	}
	return nil
}

func classifyErrors(errs []gqlError, exhausted bool, h http.Header, credID int64) error {
	var fatal []gqlError
	for _, e := range errs {
		switch {
		case e.Type == "RATE_LIMITED":
			if exhausted {
				return fmt.Errorf("credential %d exhausted: %w", credID, errRetryCredential)
			}
			if rl := secondaryLimit(h, []byte("secondary rate limit")); rl != nil {
				return rl
			}
		case e.Type == "NOT_FOUND" && len(e.Path) > 0:
			// Partial result: the field is null.
		case strings.Contains(e.Message, "timeout") || strings.Contains(e.Message, "Something went wrong while executing your query"):
			return fmt.Errorf("%w: %s", ErrQueryTimeout, e.Message)
		default:
			fatal = append(fatal, e)
		}
	}
	if len(fatal) == 0 {
		return nil
	}
	gerr := &GraphQLError{Errors: fatal}
	for _, e := range fatal {
		if e.Type == "FORBIDDEN" {
			// e.g. SAML enforcement or a private repository the pool can't read.
			return fmt.Errorf("%w: %w", jobkit.ErrPermanent, gerr)
		}
	}
	return gerr
}

// secondaryLimit recognises a secondary (abuse) rate limit. It applies to the
// caller, not just this token, so the job snoozes instead of rotating.
func secondaryLimit(h http.Header, body []byte) *jobkit.RateLimitedError {
	if ra := h.Get("Retry-After"); ra != "" {
		secs, _ := strconv.Atoi(ra)
		return &jobkit.RateLimitedError{Platform: string(ID), ResetAt: time.Now().Add(time.Duration(secs) * time.Second)}
	}
	if bytes.Contains(bytes.ToLower(body), []byte("secondary rate limit")) {
		return &jobkit.RateLimitedError{Platform: string(ID), ResetAt: time.Now().Add(secondaryLimitWait)}
	}
	return nil
}

// rest performs a REST GET with the given token, bypassing the pool: a
// credential test must use the credential under test.
func (c *Client) rest(ctx context.Context, token, path string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.restURL+path, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	setHeaders(req, token)
	return c.http.Do(req)
}

func setHeaders(req *http.Request, token string) {
	req.Header.Set("User-Agent", "raise-miner")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
}

func parseQuota(h http.Header, fallbackScope string) (platform.Quota, bool) {
	limit, err1 := strconv.Atoi(h.Get("X-RateLimit-Limit"))
	remaining, err2 := strconv.Atoi(h.Get("X-RateLimit-Remaining"))
	reset, err3 := strconv.ParseInt(h.Get("X-RateLimit-Reset"), 10, 64)
	if err1 != nil || err2 != nil || err3 != nil {
		return platform.Quota{}, false
	}
	scope := h.Get("X-RateLimit-Resource")
	if scope == "" {
		scope = fallbackScope
	}
	return platform.Quota{Scope: scope, RequestLimit: limit, RequestsRemaining: remaining, ResetsAt: time.Unix(reset, 0)}, true
}

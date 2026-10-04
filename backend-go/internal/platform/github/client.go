package github

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"time"

	"raise/internal/jobkit"
	"raise/internal/platform"
)

// Rate-limit scopes ("resources" in GitHub's terms).
const (
	ScopeCore   = "core"
	ScopeSearch = "search"
)

// maxLeaseAttempts bounds how many credentials one request tries before
// giving up (each 401 or exhausted quota moves on to the next credential).
const maxLeaseAttempts = 3

var errRetryCredential = errors.New("retry with another credential")

// Client is a GitHub REST client that leases a credential per request from
// the pool and feeds observed rate limits back into it.
type Client struct {
	http    *http.Client
	baseURL string
	leaser  platform.Leaser
}

func NewClient(hc *http.Client, baseURL string, leaser platform.Leaser) *Client {
	return &Client{http: hc, baseURL: baseURL, leaser: leaser}
}

// Page holds the page numbers advertised in the Link header (0 if absent).
type Page struct {
	Next int
	Last int
}

// Get performs a GET with a leased credential and decodes the JSON body into out.
func (c *Client) Get(ctx context.Context, scope, path string, query url.Values, out any) (Page, error) {
	var lastErr error
	for range maxLeaseAttempts {
		lease, err := c.leaser.Lease(ctx, ID, scope)
		if err != nil {
			return Page{}, err
		}
		page, err := c.get(ctx, lease, scope, path, query, out)
		if !errors.Is(err, errRetryCredential) {
			return page, err
		}
		lastErr = err
	}
	return Page{}, lastErr
}

func (c *Client) get(ctx context.Context, lease platform.Lease, scope, path string, query url.Values, out any) (Page, error) {
	resp, err := c.do(ctx, lease.Credential().Field("token"), path, query)
	if err != nil {
		return Page{}, err
	}
	defer resp.Body.Close()

	quota, hasQuota := parseQuota(resp.Header, scope)
	if hasQuota {
		_ = lease.Report(ctx, quota)
	}

	switch {
	case resp.StatusCode == http.StatusUnauthorized:
		_ = lease.Invalidate(ctx, "rejected by GitHub (401)")
		return Page{}, fmt.Errorf("credential %d: %w", lease.Credential().ID, errRetryCredential)
	case resp.StatusCode == http.StatusForbidden || resp.StatusCode == http.StatusTooManyRequests:
		if ra := resp.Header.Get("Retry-After"); ra != "" {
			// Secondary rate limit: applies to the caller, not just this token.
			secs, _ := strconv.Atoi(ra)
			return Page{}, &jobkit.RateLimitedError{Platform: string(ID), ResetAt: time.Now().Add(time.Duration(secs) * time.Second)}
		}
		if hasQuota && quota.RequestsRemaining == 0 {
			return Page{}, fmt.Errorf("credential %d exhausted: %w", lease.Credential().ID, errRetryCredential)
		}
		return Page{}, fmt.Errorf("%w: GitHub returned %s for %s", jobkit.ErrPermanent, resp.Status, path)
	case resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusGone:
		return Page{}, fmt.Errorf("%w: GitHub returned %s for %s", jobkit.ErrPermanent, resp.Status, path)
	case resp.StatusCode >= 400:
		return Page{}, fmt.Errorf("unexpected response from GitHub for %s: %s", path, resp.Status)
	}

	if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
		return Page{}, fmt.Errorf("decode %s: %w", path, err)
	}
	return parseLink(resp.Header.Get("Link")), nil
}

func (c *Client) do(ctx context.Context, token, path string, query url.Values) (*http.Response, error) {
	u := c.baseURL + path
	if len(query) > 0 {
		u += "?" + query.Encode()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "raise-miner")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	return c.http.Do(req)
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

var linkRE = regexp.MustCompile(`<([^>]+)>;\s*rel="(\w+)"`)

func parseLink(header string) Page {
	var p Page
	for _, m := range linkRE.FindAllStringSubmatch(header, -1) {
		u, err := url.Parse(m[1])
		if err != nil {
			continue
		}
		n, _ := strconv.Atoi(u.Query().Get("page"))
		switch m[2] {
		case "next":
			p.Next = n
		case "last":
			p.Last = n
		}
	}
	return p
}

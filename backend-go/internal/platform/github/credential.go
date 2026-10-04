package github

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"raise/internal/platform"
)

func (p *Platform) CredentialKinds() []platform.CredentialKind {
	return []platform.CredentialKind{{
		Name:        "personal_access_token",
		Description: "Classic or fine-grained personal access token. Public repositories need no scopes; private ones need repo read access.",
		Fields:      []platform.Field{{Name: "token", Label: "Token", Secret: true}},
	}}
}

// TestCredential identifies the token's user and reads its rate limits.
// /rate_limit does not count against the quota.
func (p *Platform) TestCredential(ctx context.Context, c platform.Credential) (platform.TestResult, error) {
	token := c.Field("token")

	resp, err := p.client.do(ctx, token, "/user", nil)
	if err != nil {
		return platform.TestResult{}, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
	case http.StatusUnauthorized:
		return platform.TestResult{OK: false, Reason: "invalid or expired token"}, nil
	case http.StatusForbidden:
		return platform.TestResult{OK: false, Reason: "token lacks permission to read the authenticated user"}, nil
	default:
		return platform.TestResult{}, fmt.Errorf("unexpected response from GitHub: %s", resp.Status)
	}
	var user struct {
		Login string `json:"login"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return platform.TestResult{}, err
	}

	result := platform.TestResult{OK: true, Identity: user.Login}

	rl, err := p.client.do(ctx, token, "/rate_limit", nil)
	if err != nil {
		return result, nil // identity is enough to call it valid
	}
	defer rl.Body.Close()
	var limits struct {
		Resources map[string]struct {
			Limit     int   `json:"limit"`
			Remaining int   `json:"remaining"`
			Reset     int64 `json:"reset"`
		} `json:"resources"`
	}
	if rl.StatusCode == http.StatusOK && json.NewDecoder(rl.Body).Decode(&limits) == nil {
		for _, scope := range []string{ScopeCore, ScopeSearch, "graphql"} {
			if r, ok := limits.Resources[scope]; ok {
				result.Quotas = append(result.Quotas, platform.Quota{
					Scope: scope, RequestLimit: r.Limit, RequestsRemaining: r.Remaining, ResetsAt: time.Unix(r.Reset, 0),
				})
			}
		}
	}
	return result, nil
}

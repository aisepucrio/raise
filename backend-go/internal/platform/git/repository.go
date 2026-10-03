package git

import (
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"time"

	"raise/internal/apperr"
	"raise/internal/platform"
)

// Repository is the central concept of git-based mining. Its history is mined
// locally from a mirror; forges attached through Remotes enrich it with
// platform data (issues, pull requests, …).
type Repository struct {
	ID             int64      `json:"id"`
	URL            string     `json:"url"`
	Host           string     `json:"host"`
	Path           string     `json:"path"`
	MirrorSyncedAt *time.Time `json:"mirror_synced_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	Remotes        []RepoRef  `json:"remotes"`
}

// RepoRef identifies a repository on a forge.
type RepoRef struct {
	Platform platform.ID `json:"platform"`
	Owner    string      `json:"owner" doc:"Owner, organisation or (GitLab) group path"`
	Name     string      `json:"name"`
}

func (r Repository) Remote(p platform.ID) (RepoRef, bool) {
	for _, ref := range r.Remotes {
		if ref.Platform == p {
			return ref, true
		}
	}
	return RepoRef{}, false
}

var scpLikeRE = regexp.MustCompile(`^(?:[\w.-]+@)?([\w.-]+):(.+)$`)

// NormalizeURL turns the many spellings of a repository URL (https, ssh,
// scp-like, with or without .git) into a canonical https URL plus host and path.
func NormalizeURL(raw string) (canonical, host, path string, err error) {
	raw = strings.TrimSpace(raw)
	invalid := fmt.Errorf("%w: %q is not a repository URL", apperr.ErrInvalid, raw)

	if !strings.Contains(raw, "://") {
		m := scpLikeRE.FindStringSubmatch(raw)
		if m == nil {
			return "", "", "", invalid
		}
		host, path = m[1], m[2]
	} else {
		u, perr := url.Parse(raw)
		if perr != nil {
			return "", "", "", invalid
		}
		switch u.Scheme {
		case "https", "http", "ssh", "git":
		default:
			return "", "", "", invalid
		}
		host, path = u.Hostname(), u.Path
	}

	host = strings.ToLower(host)
	path = strings.TrimSuffix(strings.Trim(path, "/"), ".git")
	if host == "" || path == "" || !strings.Contains(path, "/") || strings.Contains(path, "..") {
		return "", "", "", invalid
	}
	return "https://" + host + "/" + path, host, path, nil
}

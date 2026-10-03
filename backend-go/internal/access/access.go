// Package access holds the authorization vocabulary shared by every package
// that exposes HTTP operations: roles, the authenticated Principal, and the
// operation metadata used to declare the role an endpoint requires.
//
// It deliberately has no knowledge of how principals are authenticated (that
// is the auth package), so platforms can declare access rules without
// importing auth.
package access

import (
	"context"
	"fmt"

	"github.com/danielgtaylor/huma/v2"
)

type Role string

const (
	Viewer     Role = "viewer"
	Researcher Role = "researcher"
	Admin      Role = "admin"
)

var rank = map[Role]int{Viewer: 1, Researcher: 2, Admin: 3}

func ParseRole(s string) (Role, error) {
	r := Role(s)
	if _, ok := rank[r]; !ok {
		return "", fmt.Errorf("unknown role %q", s)
	}
	return r, nil
}

// Allows reports whether r grants at least the required role.
func (r Role) Allows(required Role) bool {
	return rank[r] >= rank[required]
}

type Principal struct {
	UserID   int64
	Username string
	Role     Role
	// Via is "session" or "api_key".
	Via string
}

type principalKey struct{}

func WithPrincipal(ctx context.Context, p Principal) context.Context {
	return context.WithValue(ctx, principalKey{}, p)
}

func FromContext(ctx context.Context) (Principal, bool) {
	p, ok := ctx.Value(principalKey{}).(Principal)
	return p, ok
}

const (
	metaRole   = "access.role"
	metaPublic = "access.public"
)

// Require is used as huma.Operation.Metadata to declare the minimum role.
// Operations without metadata default to requiring Viewer.
func Require(r Role) map[string]any {
	return map[string]any{metaRole: r}
}

// Public marks an operation as not requiring authentication.
func Public() map[string]any {
	return map[string]any{metaPublic: true}
}

// RequiredRole returns the role an operation requires, or public=true.
func RequiredRole(op *huma.Operation) (role Role, public bool) {
	if op == nil {
		return Viewer, false
	}
	if p, _ := op.Metadata[metaPublic].(bool); p {
		return "", true
	}
	if r, ok := op.Metadata[metaRole].(Role); ok {
		return r, false
	}
	return Viewer, false
}

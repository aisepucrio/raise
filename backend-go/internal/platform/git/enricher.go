package git

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"

	"raise/internal/jobkit"
	"raise/internal/platform"
)

// Enricher is implemented by forges (github, gitlab). It is defined here, by
// its consumer, so forges import git and git never imports a forge: forges
// are handed to git.New at wiring time.
type Enricher interface {
	platform.Platform

	// MatchRemote reports whether host/path is a repository on this forge.
	MatchRemote(host, path string) (RepoRef, bool)

	// CloneAuth returns credentials for cloning (needed for private
	// repositories). Returning nil means clone anonymously.
	CloneAuth(ctx context.Context, ref RepoRef) (*CloneAuth, error)

	// StartEnrichment enqueues the forge's root jobs for the requested
	// resources. Unknown resources must wrap apperr.ErrInvalid.
	StartEnrichment(ctx context.Context, tx pgx.Tx, enq jobkit.Enqueuer, repo Repository, ref RepoRef, req EnrichRequest) error

	// OnCommitsMined is called in the transaction that stores each mined
	// batch; the returned jobs are inserted in that same transaction. This is
	// how commit-level enrichment (commit → login, commit → PR) is chained
	// after local mining without a workflow engine.
	OnCommitsMined(repo Repository, ref RepoRef, shas []string) []river.InsertManyParams
}

type CloneAuth struct {
	Username string
	Password string
}

type EnrichRequest struct {
	Resources []string   `json:"resources"`
	Since     *time.Time `json:"since,omitempty"`
}

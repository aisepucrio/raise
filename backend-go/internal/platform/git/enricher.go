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
	// batch, for every forge the collection asked to enrich (req is that
	// forge's request); the returned jobs are inserted in that same
	// transaction. This is how commit-level enrichment (commit → login,
	// commit → PR) is chained after local mining without a workflow engine.
	OnCommitsMined(repo Repository, ref RepoRef, req EnrichRequest, shas []string) []river.InsertManyParams

	// RepositoryData describes what the forge mined for the repository: one
	// part per kind of data that can be removed on its own, empty ones
	// included.
	RepositoryData(ctx context.Context, repoID int64) ([]DataPart, error)

	// DeleteRepositoryData removes one part, by key, in tx. Unknown keys wrap
	// apperr.ErrNotFound. The key "commits" is reserved for data about the
	// repository's commits: git removes it with its own commits.
	DeleteRepositoryData(ctx context.Context, tx pgx.Tx, repoID int64, key string) error
}

// CommitDataKey is the DataPart key of a forge's commit enrichment, which git
// removes along with the repository's commits.
const CommitDataKey = "commits"

// DataPart is one kind of data mined for a repository, which an admin can
// review and remove on its own (GET /api/repositories/{id}/data).
type DataPart struct {
	Platform    platform.ID `json:"platform"`
	Key         string      `json:"key" doc:"Unique within the platform; the path segment that removes it"`
	Label       string      `json:"label"`
	Description string      `json:"description" doc:"What it holds, and what removing it also removes"`
	ItemCount   int64       `json:"item_count"`
	// SharedCount counts items that other repositories (forks) also contain.
	// Removing the part keeps them for those repositories.
	SharedCount int64      `json:"shared_count" doc:"Items other repositories also contain; removing the part keeps them"`
	LastMinedAt *time.Time `json:"last_mined_at"`
}

type CloneAuth struct {
	Username string
	Password string
}

type EnrichRequest struct {
	Resources []string `json:"resources"`
	// Since limits a re-run to items updated since then (incremental mining).
	Since *time.Time `json:"since,omitempty"`
	// CreatedSince (inclusive) and CreatedUntil (exclusive) limit the
	// collection to items created in that window, for a dataset of a period.
	CreatedSince *time.Time `json:"created_since,omitempty"`
	CreatedUntil *time.Time `json:"created_until,omitempty"`
}

// MinedAt reads a nullable timestamp that sqlc types as any (an aggregate
// such as max(last_mined_at)), for DataPart.LastMinedAt.
func MinedAt(v any) *time.Time {
	if t, ok := v.(time.Time); ok {
		return &t
	}
	return nil
}

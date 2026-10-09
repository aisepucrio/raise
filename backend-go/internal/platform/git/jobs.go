package git

import (
	"github.com/riverqueue/river"

	"raise/internal/jobkit"
	"raise/internal/platform"
)

const queue = "git"

// SyncMirrorArgs clones or fetches the repository's mirror, then plans mining.
// Enrich is the collection's forge requests, passed down to MineCommitBatch so
// each mined batch can be enriched (Enricher.OnCommitsMined).
type SyncMirrorArgs struct {
	RepositoryID int64                         `json:"repository_id"`
	Enrich       map[platform.ID]EnrichRequest `json:"enrich,omitempty"`
}

func (SyncMirrorArgs) Kind() string { return "git.sync_mirror" }
func (SyncMirrorArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: queue, UniqueOpts: jobkit.UniqueInFlight()}
}

// PlanCommitsArgs lists commits not yet mined for the repository and fans
// them out into MineCommitBatch jobs.
type PlanCommitsArgs struct {
	RepositoryID int64                         `json:"repository_id"`
	Enrich       map[platform.ID]EnrichRequest `json:"enrich,omitempty"`
}

func (PlanCommitsArgs) Kind() string { return "git.plan_commits" }
func (PlanCommitsArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: queue, UniqueOpts: jobkit.UniqueInFlight()}
}

// MineCommitBatchArgs mines an explicit list of commits. Because the work is
// fully described by its args and stored with upserts, it is idempotent.
type MineCommitBatchArgs struct {
	RepositoryID int64                         `json:"repository_id"`
	SHAs         []string                      `json:"shas"`
	Enrich       map[platform.ID]EnrichRequest `json:"enrich,omitempty"`
}

func (MineCommitBatchArgs) Kind() string { return "git.mine_commit_batch" }
func (MineCommitBatchArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: queue, UniqueOpts: jobkit.UniqueInFlight()}
}

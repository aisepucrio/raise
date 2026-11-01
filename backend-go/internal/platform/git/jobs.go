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
	Diffs        bool                          `json:"diffs,omitempty"`
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
	// Diffs also mines the diffs of the planned commits, and of the
	// repository's commits mined earlier without them.
	Diffs bool `json:"diffs,omitempty"`
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
	// Diffs chains MineDiffBatch jobs for the batch, in the transaction that
	// stores it.
	Diffs bool `json:"diffs,omitempty"`
}

func (MineCommitBatchArgs) Kind() string { return "git.mine_commit_batch" }
func (MineCommitBatchArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: queue, UniqueOpts: jobkit.UniqueInFlight()}
}

// PruneMirrorsArgs removes the mirrors of repositories that no longer exist.
// Deleting a repository is an API request, and only the worker has the
// mirror volume, so mirrors are removed here, periodically.
type PruneMirrorsArgs struct{}

func (PruneMirrorsArgs) Kind() string { return "git.prune_mirrors" }
func (PruneMirrorsArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: queue, UniqueOpts: jobkit.UniqueInFlight()}
}

// MineDiffBatchArgs mines the diffs of mined commits into commit_file_diffs.
// Diffs are much larger than commit metadata, so batches are smaller
// (diffBatchSize). Rows are inserted once, so it is idempotent.
type MineDiffBatchArgs struct {
	RepositoryID int64    `json:"repository_id"`
	SHAs         []string `json:"shas"`
}

func (MineDiffBatchArgs) Kind() string { return "git.mine_diff_batch" }
func (MineDiffBatchArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: queue, UniqueOpts: jobkit.UniqueInFlight()}
}

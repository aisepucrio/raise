package git

import (
	"context"
	"fmt"
	"slices"

	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"

	"raise/internal/jobkit"
	"raise/internal/platform/git/sqlc"
)

const (
	filterChunk   = 10_000 // SHAs per "which of these are already mined" query
	insertChunk   = 1_000  // jobs per InsertMany call
	diffBatchSize = 100    // commits per MineDiffBatch job
)

type syncMirrorWorker struct {
	river.WorkerDefaults[SyncMirrorArgs]
	p *Platform
}

func (w *syncMirrorWorker) Work(ctx context.Context, job *river.Job[SyncMirrorArgs]) error {
	p := w.p
	repo, err := p.GetRepository(ctx, job.Args.RepositoryID)
	if err != nil {
		return fmt.Errorf("%w: %v", jobkit.ErrPermanent, err)
	}
	if err := p.mirrors.Sync(ctx, repo.ID, repo.URL, p.cloneAuth(ctx, repo)); err != nil {
		return err
	}
	return pgx.BeginFunc(ctx, p.deps.DB, func(tx pgx.Tx) error {
		if err := p.q.WithTx(tx).MarkMirrorSynced(ctx, repo.ID); err != nil {
			return err
		}
		_, err := jobkit.FromJob(ctx, job.JobRow).Enqueue(ctx, tx, jobkit.Job(PlanCommitsArgs{
			RepositoryID: repo.ID, Enrich: job.Args.Enrich, Diffs: job.Args.Diffs,
		}))
		return err
	})
}

// cloneAuth asks the repository's forges for clone credentials. Failing to get
// any is not fatal: public repositories clone anonymously.
func (p *Platform) cloneAuth(ctx context.Context, repo Repository) *CloneAuth {
	for _, ref := range repo.Remotes {
		e, ok := p.enrichers[ref.Platform]
		if !ok {
			continue
		}
		auth, err := e.CloneAuth(ctx, ref)
		if err != nil {
			p.deps.Logger.Info("cloning without credentials", "repository", repo.URL, "forge", ref.Platform, "reason", err)
			continue
		}
		if auth != nil {
			return auth
		}
	}
	return nil
}

type planCommitsWorker struct {
	river.WorkerDefaults[PlanCommitsArgs]
	p *Platform
}

func (w *planCommitsWorker) Work(ctx context.Context, job *river.Job[PlanCommitsArgs]) error {
	p := w.p
	repoID := job.Args.RepositoryID

	refs, err := p.mirrors.Refs(ctx, repoID)
	if err != nil {
		return err
	}
	all, err := p.mirrors.RevList(ctx, repoID)
	if err != nil {
		return err
	}
	var pending []string
	for chunk := range chunks(all, filterChunk) {
		unmined, err := p.q.FilterUnminedCommits(ctx, sqlc.FilterUnminedCommitsParams{RepositoryID: repoID, Shas: chunk})
		if err != nil {
			return err
		}
		pending = append(pending, unmined...)
	}

	var jobs []river.InsertManyParams
	for batch := range chunks(pending, p.cfg.BatchSize) {
		jobs = append(jobs, jobkit.Job(MineCommitBatchArgs{RepositoryID: repoID, SHAs: batch, Enrich: job.Args.Enrich, Diffs: job.Args.Diffs}))
	}
	if job.Args.Diffs {
		// Commits mined earlier without their diffs. The pending ones aren't
		// linked to the repository yet; their batches chain their diffs.
		undiffed, err := p.q.ListCommitsWithoutDiffs(ctx, repoID)
		if err != nil {
			return err
		}
		jobs = append(jobs, diffJobs(repoID, undiffed)...)
	}

	names := make([]string, len(refs))
	shas := make([]string, len(refs))
	for i, r := range refs {
		names[i], shas[i] = r.Name, r.SHA
	}

	enq := jobkit.FromJob(ctx, job.JobRow)
	return pgx.BeginFunc(ctx, p.deps.DB, func(tx pgx.Tx) error {
		q := p.q.WithTx(tx)
		if err := q.DeleteRefs(ctx, repoID); err != nil {
			return err
		}
		if err := q.InsertRefs(ctx, sqlc.InsertRefsParams{RepositoryID: repoID, Names: names, Shas: shas}); err != nil {
			return err
		}
		for chunk := range chunks(jobs, insertChunk) {
			if _, err := enq.Enqueue(ctx, tx, chunk...); err != nil {
				return err
			}
		}
		return nil
	})
}

type mineCommitBatchWorker struct {
	river.WorkerDefaults[MineCommitBatchArgs]
	p *Platform
}

func (w *mineCommitBatchWorker) Work(ctx context.Context, job *river.Job[MineCommitBatchArgs]) error {
	p := w.p
	repo, err := p.GetRepository(ctx, job.Args.RepositoryID)
	if err != nil {
		return fmt.Errorf("%w: %v", jobkit.ErrPermanent, err)
	}
	entries, err := p.mirrors.Log(ctx, repo.ID, job.Args.SHAs)
	if err != nil {
		return err
	}
	mined := make([]string, len(entries))
	var withFiles []string
	for i, e := range entries {
		mined[i] = e.SHA
		if len(e.Files) > 0 {
			withFiles = append(withFiles, e.SHA)
		}
	}

	enq := jobkit.FromJob(ctx, job.JobRow)
	return pgx.BeginFunc(ctx, p.deps.DB, func(tx pgx.Tx) error {
		if err := storeBatch(ctx, p.q.WithTx(tx), repo.ID, entries); err != nil {
			return err
		}
		if job.Args.Diffs {
			if _, err := enq.Enqueue(ctx, tx, diffJobs(repo.ID, withFiles)...); err != nil {
				return err
			}
		}
		for _, ref := range repo.Remotes {
			e, ok := p.enrichers[ref.Platform]
			req, requested := job.Args.Enrich[ref.Platform]
			if !ok || !requested {
				continue
			}
			if _, err := enq.Enqueue(ctx, tx, e.OnCommitsMined(repo, ref, req, mined)...); err != nil {
				return err
			}
		}
		return nil
	})
}

type pruneMirrorsWorker struct {
	river.WorkerDefaults[PruneMirrorsArgs]
	p *Platform
}

func (w *pruneMirrorsWorker) Work(ctx context.Context, _ *river.Job[PruneMirrorsArgs]) error {
	p := w.p
	mirrored, err := p.mirrors.MirroredRepositories()
	if err != nil || len(mirrored) == 0 {
		return err
	}
	existing, err := p.q.ListRepositoryIDs(ctx, mirrored)
	if err != nil {
		return err
	}
	for _, id := range mirrored {
		if slices.Contains(existing, id) {
			continue
		}
		if err := p.mirrors.Remove(ctx, id); err != nil {
			return err
		}
		p.deps.Logger.Info("removed the mirror of a deleted repository", "repository_id", id)
	}
	return nil
}

func diffJobs(repoID int64, shas []string) []river.InsertManyParams {
	var jobs []river.InsertManyParams
	for batch := range chunks(shas, diffBatchSize) {
		jobs = append(jobs, jobkit.Job(MineDiffBatchArgs{RepositoryID: repoID, SHAs: batch}))
	}
	return jobs
}

type mineDiffBatchWorker struct {
	river.WorkerDefaults[MineDiffBatchArgs]
	p *Platform
}

// Work stores each commit's diffs as git streams them, so a batch never holds
// more than one commit's diffs (at most maxCommitDiffBytes) in memory.
func (w *mineDiffBatchWorker) Work(ctx context.Context, job *river.Job[MineDiffBatchArgs]) error {
	p := w.p
	return pgx.BeginFunc(ctx, p.deps.DB, func(tx pgx.Tx) error {
		q := p.q.WithTx(tx)
		return p.mirrors.Diffs(ctx, job.Args.RepositoryID, job.Args.SHAs, func(c CommitDiffs) error {
			return storeDiffs(ctx, q, c)
		})
	})
}

func chunks[T any](s []T, n int) func(func([]T) bool) {
	return func(yield func([]T) bool) {
		for i := 0; i < len(s); i += n {
			if !yield(s[i:min(i+n, len(s))]) {
				return
			}
		}
	}
}

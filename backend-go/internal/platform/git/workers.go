package git

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"

	"raise/internal/jobkit"
	"raise/internal/platform/git/sqlc"
)

const (
	filterChunk = 10_000 // SHAs per "which of these are already mined" query
	insertChunk = 1_000  // jobs per InsertMany call
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
		_, err := jobkit.FromJob(ctx, job.JobRow).Enqueue(ctx, tx, jobkit.Job(PlanCommitsArgs{RepositoryID: repo.ID, Enrich: job.Args.Enrich}))
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
		jobs = append(jobs, jobkit.Job(MineCommitBatchArgs{RepositoryID: repoID, SHAs: batch, Enrich: job.Args.Enrich}))
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
	for i, e := range entries {
		mined[i] = e.SHA
	}

	enq := jobkit.FromJob(ctx, job.JobRow)
	return pgx.BeginFunc(ctx, p.deps.DB, func(tx pgx.Tx) error {
		if err := storeBatch(ctx, p.q.WithTx(tx), repo.ID, entries); err != nil {
			return err
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

func chunks[T any](s []T, n int) func(func([]T) bool) {
	return func(yield func([]T) bool) {
		for i := 0; i < len(s); i += n {
			if !yield(s[i:min(i+n, len(s))]) {
				return
			}
		}
	}
}

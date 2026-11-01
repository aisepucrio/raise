package git

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"

	"raise/internal/apperr"
	"raise/internal/jobkit"
	"raise/internal/platform"
	"raise/internal/platform/git/sqlc"
)

// Commit and CommitFile are the API representations of mined history.
type Commit struct {
	SHA            string       `json:"sha"`
	ParentSHAs     []string     `json:"parent_shas"`
	AuthorName     string       `json:"author_name"`
	AuthorEmail    string       `json:"author_email"`
	AuthoredAt     time.Time    `json:"authored_at"`
	CommitterName  string       `json:"committer_name"`
	CommitterEmail string       `json:"committer_email"`
	CommittedAt    time.Time    `json:"committed_at"`
	Message        string       `json:"message"`
	LinesAdded     int32        `json:"lines_added"`
	LinesDeleted   int32        `json:"lines_deleted"`
	FilesChanged   int32        `json:"files_changed"`
	FirstMinedAt   time.Time    `json:"first_mined_at"`
	Files          []CommitFile `json:"files,omitempty"`
}

type CommitFile struct {
	Path              string  `json:"path"`
	PreviousPath      *string `json:"previous_path,omitempty"`
	ChangeType        string  `json:"change_type" enum:"added,modified,deleted,renamed,copied,type_changed,unmerged"`
	SimilarityPercent *int32  `json:"similarity_percent,omitempty"`
	LinesAdded        *int32  `json:"lines_added" doc:"null for binary files"`
	LinesDeleted      *int32  `json:"lines_deleted"`
	// The diff fields are set only when requested and mined.
	Diff            *string `json:"diff,omitempty" doc:"With diffs=true: the unified diff hunks; absent for binary files, mode changes and pure renames, and until diffs are mined"`
	DiffSizeBytes   *int32  `json:"diff_size_bytes,omitempty" doc:"With diffs=true, once mined: the size of the whole diff, before truncation"`
	IsDiffTruncated *bool   `json:"is_diff_truncated,omitempty" doc:"With diffs=true, once mined"`
}

func toCommit(c sqlc.Commit) Commit {
	return Commit{
		SHA: c.Sha, ParentSHAs: c.ParentShas,
		AuthorName: c.AuthorName, AuthorEmail: c.AuthorEmail, AuthoredAt: c.AuthoredAt,
		CommitterName: c.CommitterName, CommitterEmail: c.CommitterEmail, CommittedAt: c.CommittedAt,
		Message: c.Message, LinesAdded: c.LinesAdded, LinesDeleted: c.LinesDeleted, FilesChanged: c.FilesChanged,
		FirstMinedAt: c.FirstMinedAt,
	}
}

// Register adds a repository (idempotently) and attaches every forge whose
// MatchRemote recognises its URL.
func (p *Platform) Register(ctx context.Context, rawURL string) (Repository, error) {
	var repo Repository
	err := pgx.BeginFunc(ctx, p.deps.DB, func(tx pgx.Tx) error {
		var err error
		repo, err = p.register(ctx, p.q.WithTx(tx), rawURL)
		return err
	})
	return repo, err
}

func (p *Platform) register(ctx context.Context, q *sqlc.Queries, rawURL string) (Repository, error) {
	canonical, host, path, err := NormalizeURL(rawURL)
	if err != nil {
		return Repository{}, err
	}
	row, err := q.UpsertRepository(ctx, sqlc.UpsertRepositoryParams{Url: canonical, Host: host, Path: path})
	if err != nil {
		return Repository{}, err
	}
	for _, e := range p.order {
		ref, ok := e.MatchRemote(host, path)
		if !ok {
			continue
		}
		err := q.UpsertRemote(ctx, sqlc.UpsertRemoteParams{
			RepositoryID: row.ID, Platform: string(e.ID()), Owner: ref.Owner, Name: ref.Name,
		})
		if err != nil {
			return Repository{}, err
		}
	}
	return p.getRepository(ctx, q, row.ID)
}

// GetRepository is exported for forges, which need a repository's remotes.
func (p *Platform) GetRepository(ctx context.Context, id int64) (Repository, error) {
	return p.getRepository(ctx, p.q, id)
}

func (p *Platform) getRepository(ctx context.Context, q *sqlc.Queries, id int64) (Repository, error) {
	row, err := q.GetRepository(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return Repository{}, fmt.Errorf("%w: repository %d", apperr.ErrNotFound, id)
	}
	if err != nil {
		return Repository{}, err
	}
	repos, err := p.withRemotes(ctx, q, []sqlc.Repository{row})
	if err != nil {
		return Repository{}, err
	}
	return repos[0], nil
}

func (p *Platform) withRemotes(ctx context.Context, q *sqlc.Queries, rows []sqlc.Repository) ([]Repository, error) {
	ids := make([]int64, len(rows))
	for i, r := range rows {
		ids[i] = r.ID
	}
	remotes, err := q.ListRemotes(ctx, ids)
	if err != nil {
		return nil, err
	}
	byRepo := map[int64][]RepoRef{}
	for _, r := range remotes {
		byRepo[r.RepositoryID] = append(byRepo[r.RepositoryID], RepoRef{Platform: platform.ID(r.Platform), Owner: r.Owner, Name: r.Name})
	}
	out := make([]Repository, len(rows))
	for i, r := range rows {
		out[i] = Repository{
			ID: r.ID, URL: r.Url, Host: r.Host, Path: r.Path,
			MirrorLastSyncedAt: r.MirrorLastSyncedAt, CreatedAt: r.CreatedAt,
			Remotes: byRepo[r.ID],
		}
		if out[i].Remotes == nil {
			out[i].Remotes = []RepoRef{}
		}
	}
	return out, nil
}

func (p *Platform) GetCommit(ctx context.Context, repoID int64, sha string, withDiffs bool) (Commit, error) {
	row, err := p.q.GetRepositoryCommit(ctx, sqlc.GetRepositoryCommitParams{RepositoryID: repoID, Sha: sha})
	if errors.Is(err, pgx.ErrNoRows) {
		return Commit{}, fmt.Errorf("%w: commit %s in repository %d", apperr.ErrNotFound, sha, repoID)
	}
	if err != nil {
		return Commit{}, err
	}
	files, err := p.q.ListCommitFiles(ctx, sha)
	if err != nil {
		return Commit{}, err
	}
	c := toCommit(row)
	c.Files = make([]CommitFile, len(files))
	for i, f := range files {
		c.Files[i] = CommitFile{
			Path: f.Path, PreviousPath: f.PreviousPath, ChangeType: f.ChangeType,
			SimilarityPercent: f.SimilarityPercent, LinesAdded: f.LinesAdded, LinesDeleted: f.LinesDeleted,
		}
	}
	if !withDiffs {
		return c, nil
	}
	diffs, err := p.q.ListCommitFileDiffs(ctx, sha)
	if err != nil {
		return Commit{}, err
	}
	byPath := make(map[string]sqlc.CommitFileDiff, len(diffs))
	for _, d := range diffs {
		byPath[d.Path] = d
	}
	for i := range c.Files {
		if d, ok := byPath[c.Files[i].Path]; ok {
			c.Files[i].Diff, c.Files[i].DiffSizeBytes, c.Files[i].IsDiffTruncated = d.Diff, &d.DiffSizeBytes, &d.IsDiffTruncated
		}
	}
	return c, nil
}

// storeBatch writes mined commits, their files and the repository links.
func storeBatch(ctx context.Context, q *sqlc.Queries, repoID int64, entries []LogEntry) error {
	commits := make([]sqlc.InsertCommitParams, len(entries))
	var files []sqlc.InsertCommitFileParams
	shas := make([]string, len(entries))
	for i, e := range entries {
		added, deleted := e.Totals()
		commits[i] = sqlc.InsertCommitParams{
			Sha: e.SHA, ParentShas: e.ParentSHAs,
			AuthorName: e.AuthorName, AuthorEmail: e.AuthorEmail, AuthoredAt: e.AuthoredAt,
			CommitterName: e.CommitterName, CommitterEmail: e.CommitterEmail, CommittedAt: e.CommittedAt,
			Message: e.Message, LinesAdded: added, LinesDeleted: deleted, FilesChanged: int32(len(e.Files)),
		}
		if commits[i].ParentShas == nil {
			commits[i].ParentShas = []string{}
		}
		shas[i] = e.SHA
		for _, f := range e.Files {
			fp := sqlc.InsertCommitFileParams{
				Sha: e.SHA, Path: f.Path, ChangeType: f.ChangeType,
				SimilarityPercent: f.SimilarityPercent, LinesAdded: f.LinesAdded, LinesDeleted: f.LinesDeleted,
			}
			if f.PreviousPath != "" {
				previous := f.PreviousPath
				fp.PreviousPath = &previous
			}
			files = append(files, fp)
		}
	}

	if err := execBatch(q.InsertCommit(ctx, commits)); err != nil {
		return fmt.Errorf("insert commits: %w", err)
	}
	if len(files) > 0 {
		if err := execBatch(q.InsertCommitFile(ctx, files)); err != nil {
			return fmt.Errorf("insert commit files: %w", err)
		}
	}
	return q.LinkCommits(ctx, sqlc.LinkCommitsParams{RepositoryID: repoID, Shas: shas})
}

func storeDiffs(ctx context.Context, q *sqlc.Queries, c CommitDiffs) error {
	if len(c.Files) == 0 {
		return nil
	}
	rows := make([]sqlc.InsertCommitFileDiffParams, len(c.Files))
	for i, f := range c.Files {
		rows[i] = sqlc.InsertCommitFileDiffParams{
			Sha: c.SHA, Path: f.Path, Diff: f.Diff, DiffSizeBytes: f.SizeBytes, IsDiffTruncated: f.IsTruncated,
		}
	}
	if err := execBatch(q.InsertCommitFileDiff(ctx, rows)); err != nil {
		return fmt.Errorf("insert diffs of %s: %w", c.SHA, err)
	}
	return nil
}

type batchResults interface {
	Exec(func(int, error))
	Close() error
}

func execBatch(b batchResults) error {
	var first error
	b.Exec(func(_ int, err error) {
		if err != nil && first == nil {
			first = err
		}
	})
	if err := b.Close(); err != nil && first == nil {
		first = err
	}
	return first
}

// RepositoryData is what was mined for a repository, part by part: git's
// own, then each forge's that hosts it.
type RepositoryData struct {
	Repository Repository `json:"repository"`
	Parts      []DataPart `json:"parts"`
}

const diffsKey = "diffs"

func (p *Platform) RepositoryData(ctx context.Context, id int64) (RepositoryData, error) {
	repo, err := p.GetRepository(ctx, id)
	if err != nil {
		return RepositoryData{}, err
	}
	c, err := p.q.RepositoryDataCounts(ctx, id)
	if err != nil {
		return RepositoryData{}, err
	}
	out := RepositoryData{Repository: repo, Parts: []DataPart{
		{
			Platform: ID, Key: CommitDataKey, Label: "Commits",
			Description: fmt.Sprintf("The mined history: commits with their changed files and diffs, and %d branches and tags. "+
				"Removing it also removes the forges' data about these commits.", c.RefCount),
			ItemCount: c.CommitCount, SharedCount: c.CommitSharedCount,
		},
		{
			Platform: ID, Key: diffsKey, Label: "File diffs",
			Description: "The text diff of each changed file, counted per file. Commits are kept.",
			ItemCount:   c.DiffCount, SharedCount: c.DiffSharedCount, LastMinedAt: MinedAt(c.DiffLastMinedAt),
		},
	}}
	if c.CommitCount > 0 {
		// The last fetch, which mines new commits; once removed, there are none.
		out.Parts[0].LastMinedAt = repo.MirrorLastSyncedAt
	}
	for _, ref := range repo.Remotes {
		e, ok := p.enrichers[ref.Platform]
		if !ok {
			continue
		}
		parts, err := e.RepositoryData(ctx, id)
		if err != nil {
			return RepositoryData{}, fmt.Errorf("%s data: %w", ref.Platform, err)
		}
		out.Parts = append(out.Parts, parts...)
	}
	return out, nil
}

// DeleteRepositoryData removes one part of what was mined for the
// repository, then returns what remains.
func (p *Platform) DeleteRepositoryData(ctx context.Context, id int64, from platform.ID, key string) (RepositoryData, error) {
	repo, err := p.GetRepository(ctx, id)
	if err != nil {
		return RepositoryData{}, err
	}
	if err := p.checkIdle(ctx, id); err != nil {
		return RepositoryData{}, err
	}
	err = pgx.BeginFunc(ctx, p.deps.DB, func(tx pgx.Tx) error {
		q := p.q.WithTx(tx)
		if from != ID {
			e, ok := p.enrichers[from]
			if _, hosted := repo.Remote(from); !ok || !hosted {
				return fmt.Errorf("%w: repository %d has no %s data", apperr.ErrNotFound, id, from)
			}
			return e.DeleteRepositoryData(ctx, tx, id, key)
		}
		switch key {
		case CommitDataKey:
			return p.deleteCommits(ctx, tx, q, repo)
		case diffsKey:
			_, err := q.DeleteRepositoryDiffs(ctx, id)
			return err
		}
		return fmt.Errorf("%w: git has no data part %q", apperr.ErrNotFound, key)
	})
	if err != nil {
		return RepositoryData{}, err
	}
	return p.RepositoryData(ctx, id)
}

// DeleteRepository removes the repository and everything mined for it.
// Commits that other repositories also contain are kept for them. Its mirror
// is removed by the worker's next PruneMirrors.
func (p *Platform) DeleteRepository(ctx context.Context, id int64) error {
	repo, err := p.GetRepository(ctx, id)
	if err != nil {
		return err
	}
	if err := p.checkIdle(ctx, id); err != nil {
		return err
	}
	return pgx.BeginFunc(ctx, p.deps.DB, func(tx pgx.Tx) error {
		q := p.q.WithTx(tx)
		// Forge tables keyed by the repository cascade from it; commits are
		// only linked to it, so they are deleted explicitly.
		if err := p.deleteCommits(ctx, tx, q, repo); err != nil {
			return err
		}
		_, err := q.DeleteRepository(ctx, id)
		return err
	})
}

// deleteCommits removes the repository's commits, with their refs and the
// forges' commit data, keeping commits other repositories contain.
func (p *Platform) deleteCommits(ctx context.Context, tx pgx.Tx, q *sqlc.Queries, repo Repository) error {
	for _, ref := range repo.Remotes {
		e, ok := p.enrichers[ref.Platform]
		if !ok {
			continue
		}
		if err := e.DeleteRepositoryData(ctx, tx, repo.ID, CommitDataKey); err != nil && !errors.Is(err, apperr.ErrNotFound) {
			return fmt.Errorf("%s commit data: %w", ref.Platform, err)
		}
	}
	if err := q.DeleteRefs(ctx, repo.ID); err != nil {
		return err
	}
	_, err := q.DeleteRepositoryCommits(ctx, repo.ID)
	return err
}

// checkIdle refuses to delete data that queued or running jobs are writing.
func (p *Platform) checkIdle(ctx context.Context, id int64) error {
	n, err := jobkit.UnfinishedJobs(ctx, p.deps.DB, map[string]any{"repository_id": id})
	if err != nil {
		return err
	}
	if n > 0 {
		return fmt.Errorf("%w: repository %d has %d jobs queued or running; wait for its collections to finish or cancel them",
			apperr.ErrConflict, id, n)
	}
	return nil
}

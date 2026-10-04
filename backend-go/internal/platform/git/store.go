package git

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"

	"raise/internal/apperr"
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

func (p *Platform) ListRepositories(ctx context.Context, limit, offset int32) ([]Repository, error) {
	rows, err := p.q.ListRepositories(ctx, sqlc.ListRepositoriesParams{Limit: limit, Offset: offset})
	if err != nil {
		return nil, err
	}
	return p.withRemotes(ctx, p.q, rows)
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

func (p *Platform) ListCommits(ctx context.Context, repoID int64, limit, offset int32) ([]Commit, error) {
	rows, err := p.q.ListCommits(ctx, sqlc.ListCommitsParams{RepositoryID: repoID, Limit: limit, Offset: offset})
	if err != nil {
		return nil, err
	}
	out := make([]Commit, len(rows))
	for i, c := range rows {
		out[i] = toCommit(c)
	}
	return out, nil
}

func (p *Platform) GetCommit(ctx context.Context, repoID int64, sha string) (Commit, error) {
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

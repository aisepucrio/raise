package git

import (
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Mirrors manages bare mirrors of repositories on local disk. Only branches
// and tags are fetched (not e.g. GitHub's refs/pull/*), so the mined history
// is what the repository itself contains.
//
// Sync is serialised per repository with a Postgres advisory lock; reads (Log,
// RevList, Refs) run concurrently and are safe alongside a fetch.
type Mirrors struct {
	dir  string
	git  string
	pool *pgxpool.Pool
}

// lockNamespace is the first key of the two-key advisory lock.
const lockNamespace = 0x6d6972 // "mir"

func NewMirrors(dir, gitBinary string, pool *pgxpool.Pool) *Mirrors {
	return &Mirrors{dir: dir, git: gitBinary, pool: pool}
}

func (m *Mirrors) Path(repoID int64) string {
	return filepath.Join(m.dir, fmt.Sprintf("%d.git", repoID))
}

// Sync clones the repository if it isn't mirrored yet, then fetches.
func (m *Mirrors) Sync(ctx context.Context, repoID int64, url string, auth *CloneAuth) error {
	conn, err := m.pool.Acquire(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()
	if _, err := conn.Exec(ctx, "SELECT pg_advisory_lock($1::int, $2::int)", lockNamespace, repoID); err != nil {
		return fmt.Errorf("lock mirror: %w", err)
	}
	defer func() {
		_, err := conn.Exec(context.WithoutCancel(ctx), "SELECT pg_advisory_unlock($1::int, $2::int)", lockNamespace, repoID)
		if err != nil {
			// A session lock would outlive this job on a pooled connection;
			// closing the connection releases it.
			_ = conn.Conn().Close(context.WithoutCancel(ctx))
		}
	}()

	path := m.Path(repoID)
	if _, err := os.Stat(path); errors.Is(err, fs.ErrNotExist) {
		if err := m.initMirror(ctx, path, url); err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	if _, err := m.run(ctx, nil, nil, "-C", path, "remote", "set-url", "origin", url); err != nil {
		return err
	}
	_, err = m.run(ctx, authEnv(auth), nil, "-C", path, "fetch", "--prune", "--quiet", "origin")
	return err
}

// initMirror creates an empty bare repository configured to fetch branches and
// tags. It is built in a temporary directory and renamed into place so a
// crashed clone never leaves a half-initialised mirror behind.
func (m *Mirrors) initMirror(ctx context.Context, path, url string) error {
	if err := os.MkdirAll(m.dir, 0o755); err != nil {
		return err
	}
	tmp, err := os.MkdirTemp(m.dir, filepath.Base(path)+".tmp-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(tmp)

	steps := [][]string{
		{"init", "--bare", "--quiet", tmp},
		{"-C", tmp, "remote", "add", "origin", url},
		{"-C", tmp, "config", "remote.origin.fetch", "+refs/heads/*:refs/heads/*"},
		{"-C", tmp, "config", "--add", "remote.origin.fetch", "+refs/tags/*:refs/tags/*"},
		{"-C", tmp, "config", "gc.auto", "0"},
	}
	for _, args := range steps {
		if _, err := m.run(ctx, nil, nil, args...); err != nil {
			return err
		}
	}
	return os.Rename(tmp, path)
}

type Ref struct {
	Name string
	SHA  string // commit the ref points to (annotated tags are peeled)
}

func (m *Mirrors) Refs(ctx context.Context, repoID int64) ([]Ref, error) {
	out, err := m.run(ctx, nil, nil, "-C", m.Path(repoID), "for-each-ref",
		"--format=%(refname)%00%(objectname)%00%(*objectname)", "refs/heads", "refs/tags")
	if err != nil {
		return nil, err
	}
	var refs []Ref
	for line := range strings.Lines(string(out)) {
		parts := strings.Split(strings.TrimRight(line, "\n"), "\x00")
		if len(parts) != 3 {
			continue
		}
		sha := parts[1]
		if parts[2] != "" {
			sha = parts[2]
		}
		refs = append(refs, Ref{Name: parts[0], SHA: sha})
	}
	return refs, nil
}

// RevList returns every commit reachable from branches and tags.
func (m *Mirrors) RevList(ctx context.Context, repoID int64) ([]string, error) {
	cmd := m.command(ctx, nil, "-C", m.Path(repoID), "rev-list", "--branches", "--tags")
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	var shas []string
	sc := bufio.NewScanner(stdout)
	for sc.Scan() {
		shas = append(shas, sc.Text())
	}
	if err := cmd.Wait(); err != nil {
		return nil, gitError(err, stderr.Bytes(), "rev-list")
	}
	return shas, sc.Err()
}

// Log mines the given commits.
func (m *Mirrors) Log(ctx context.Context, repoID int64, shas []string) ([]LogEntry, error) {
	cmd := m.command(ctx, nil, append([]string{"-C", m.Path(repoID)}, logArgs()...)...)
	cmd.Stdin = strings.NewReader(strings.Join(shas, "\n") + "\n")
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	var entries []LogEntry
	perr := ParseLog(stdout, func(e LogEntry) error {
		entries = append(entries, e)
		return nil
	})
	if perr != nil {
		_, _ = io.Copy(io.Discard, stdout)
	}
	if err := cmd.Wait(); err != nil {
		return nil, gitError(err, stderr.Bytes(), "log")
	}
	return entries, perr
}

func (m *Mirrors) command(ctx context.Context, env []string, args ...string) *exec.Cmd {
	cmd := exec.CommandContext(ctx, m.git, args...)
	cmd.Env = append(os.Environ(), "GIT_TERMINAL_PROMPT=0")
	cmd.Env = append(cmd.Env, env...)
	return cmd
}

func (m *Mirrors) run(ctx context.Context, env []string, stdin io.Reader, args ...string) ([]byte, error) {
	cmd := m.command(ctx, env, args...)
	cmd.Stdin = stdin
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		return nil, gitError(err, stderr.Bytes(), args...)
	}
	return out, nil
}

func gitError(err error, stderr []byte, args ...string) error {
	return fmt.Errorf("git %s: %w: %s", strings.Join(args, " "), err, bytes.TrimSpace(stderr))
}

// authEnv passes credentials through environment-based git config, so they
// never appear in process arguments or in the mirror's config file.
func authEnv(a *CloneAuth) []string {
	if a == nil {
		return nil
	}
	basic := base64.StdEncoding.EncodeToString([]byte(a.Username + ":" + a.Password))
	return []string{
		"GIT_CONFIG_COUNT=1",
		"GIT_CONFIG_KEY_0=http.extraHeader",
		"GIT_CONFIG_VALUE_0=Authorization: Basic " + basic,
	}
}

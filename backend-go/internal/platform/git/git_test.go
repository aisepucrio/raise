package git

import (
	"bytes"
	"context"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"testing"
	"time"
)

// ---- logparse.go ----

// fixtureRepo builds a small repository exercising adds, binary files,
// renames, deletions, multi-line messages and a merge commit.
func fixtureRepo(t *testing.T) string {
	t.Helper()
	if _, err := exec.LookPath("git"); err != nil {
		t.Skip("git not installed")
	}
	dir := t.TempDir()
	run := func(args ...string) string {
		t.Helper()
		cmd := exec.Command("git", args...)
		cmd.Dir = dir
		cmd.Env = append(os.Environ(),
			"GIT_AUTHOR_NAME=Ada", "GIT_AUTHOR_EMAIL=ada@example.com",
			"GIT_COMMITTER_NAME=Bob", "GIT_COMMITTER_EMAIL=bob@example.com",
			"GIT_CONFIG_GLOBAL=/dev/null", "GIT_CONFIG_SYSTEM=/dev/null",
		)
		out, err := cmd.CombinedOutput()
		if err != nil {
			t.Fatalf("git %v: %v\n%s", args, err, out)
		}
		return strings.TrimSpace(string(out))
	}
	write := func(name, content string) {
		t.Helper()
		if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}

	run("init", "-q", "-b", "main")
	write("a.txt", "one\ntwo\nthree\nfour\nfive\nsix\n")
	write("b.bin", "\x00\x01\x02")
	run("add", ".")
	run("commit", "-q", "-m", "initial\n\nwith a body\nover two lines")

	run("mv", "a.txt", "c.txt")
	write("c.txt", "one\ntwo\nthree\nfour\nfive\nsix\nseven\n")
	run("rm", "-q", "b.bin")
	run("add", ".")
	run("commit", "-q", "-m", "rename and delete")

	run("checkout", "-q", "-b", "feature")
	write("d.txt", "feature\n")
	run("add", ".")
	run("commit", "-q", "-m", "feature work")
	run("checkout", "-q", "main")
	write("e.txt", "main\n")
	run("add", ".")
	run("commit", "-q", "-m", "main work")
	run("merge", "-q", "--no-ff", "-m", "merge feature", "feature")
	return dir
}

func TestParseLog(t *testing.T) {
	dir := fixtureRepo(t)
	revs, err := exec.Command("git", "-C", dir, "rev-list", "--branches").Output()
	if err != nil {
		t.Fatal(err)
	}

	cmd := exec.CommandContext(context.Background(), "git", append([]string{"-C", dir}, logArgs()...)...)
	cmd.Stdin = bytes.NewReader(revs)
	out, err := cmd.Output()
	if err != nil {
		t.Fatal(err)
	}

	byMsg := map[string]LogEntry{}
	err = ParseLog(bytes.NewReader(out), func(e LogEntry) error {
		byMsg[strings.SplitN(e.Message, "\n", 2)[0]] = e
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(byMsg) != 5 {
		t.Fatalf("parsed %d commits, want 5: %v", len(byMsg), byMsg)
	}

	initial := byMsg["initial"]
	if initial.Message != "initial\n\nwith a body\nover two lines" {
		t.Errorf("message = %q", initial.Message)
	}
	if initial.AuthorEmail != "ada@example.com" || initial.CommitterName != "Bob" {
		t.Errorf("identities = %q / %q", initial.AuthorEmail, initial.CommitterName)
	}
	if len(initial.ParentSHAs) != 0 || len(initial.Files) != 2 {
		t.Fatalf("initial: parents=%v files=%+v", initial.ParentSHAs, initial.Files)
	}
	for _, f := range initial.Files {
		if f.Path == "b.bin" && f.LinesAdded != nil {
			t.Errorf("binary file should have nil lines added, got %d", *f.LinesAdded)
		}
		if f.Path == "a.txt" && (f.ChangeType != "added" || f.LinesAdded == nil || *f.LinesAdded != 6) {
			t.Errorf("a.txt = %+v", f)
		}
	}

	rename := byMsg["rename and delete"]
	var sawRename, sawDelete bool
	for _, f := range rename.Files {
		switch f.ChangeType {
		case "renamed":
			sawRename = f.PreviousPath == "a.txt" && f.Path == "c.txt" && f.LinesAdded != nil && *f.LinesAdded == 1 &&
				f.SimilarityPercent != nil && *f.SimilarityPercent > 50
		case "deleted":
			sawDelete = f.Path == "b.bin"
		}
	}
	if !sawRename || !sawDelete {
		t.Errorf("rename commit files = %+v", rename.Files)
	}
	if add, del := rename.Totals(); add != 1 || del != 0 {
		t.Errorf("totals = +%d -%d", add, del)
	}

	merge := byMsg["merge feature"]
	if len(merge.ParentSHAs) != 2 || len(merge.Files) != 0 {
		t.Errorf("merge: parents=%v files=%v", merge.ParentSHAs, merge.Files)
	}
}

func TestParseDiffs(t *testing.T) {
	dir := fixtureRepo(t)
	revs, err := exec.Command("git", "-C", dir, "rev-list", "--branches").Output()
	if err != nil {
		t.Fatal(err)
	}
	gitLog := func(args []string, parse func(io.Reader) error) {
		t.Helper()
		cmd := exec.CommandContext(context.Background(), "git", append([]string{"-C", dir}, args...)...)
		cmd.Stdin = bytes.NewReader(revs)
		out, err := cmd.Output()
		if err != nil {
			t.Fatal(err)
		}
		if err := parse(bytes.NewReader(out)); err != nil {
			t.Fatal(err)
		}
	}

	messages := map[string]string{}
	files := map[string][]string{}
	gitLog(logArgs(), func(r io.Reader) error {
		return ParseLog(r, func(e LogEntry) error {
			messages[e.SHA] = strings.SplitN(e.Message, "\n", 2)[0]
			for _, f := range e.Files {
				files[e.SHA] = append(files[e.SHA], f.Path)
			}
			return nil
		})
	})
	byMsg := map[string]CommitDiffs{}
	gitLog(diffArgs(), func(r io.Reader) error {
		return ParseDiffs(r, func(c CommitDiffs) error {
			byMsg[messages[c.SHA]] = c
			// The diffs name the same files, in the same order, as the
			// commit_files rows that ParseLog produces.
			var paths []string
			for _, f := range c.Files {
				paths = append(paths, f.Path)
			}
			if !slices.Equal(paths, files[c.SHA]) {
				t.Errorf("%s: diff paths %v, log paths %v", messages[c.SHA], paths, files[c.SHA])
			}
			return nil
		})
	})
	if len(byMsg) != 5 {
		t.Fatalf("parsed %d commits, want 5", len(byMsg))
	}

	diff := func(msg, path string) FileDiff {
		t.Helper()
		for _, f := range byMsg[msg].Files {
			if f.Path == path {
				return f
			}
		}
		t.Fatalf("%s: no diff for %s in %+v", msg, path, byMsg[msg].Files)
		return FileDiff{}
	}
	if d := diff("initial", "a.txt"); d.Diff == nil || *d.Diff != "@@ -0,0 +1,6 @@\n+one\n+two\n+three\n+four\n+five\n+six\n" ||
		int(d.SizeBytes) != len(*d.Diff) || d.IsTruncated {
		t.Errorf("a.txt = %+v (diff %q)", d, deref(d.Diff))
	}
	if d := diff("initial", "b.bin"); d.Diff != nil || d.SizeBytes != 0 {
		t.Errorf("binary file has a diff: %+v", d)
	}
	if d := diff("rename and delete", "c.txt"); d.Diff == nil || !strings.HasSuffix(*d.Diff, " six\n+seven\n") {
		t.Errorf("renamed c.txt = %q", deref(d.Diff))
	}
	if c := byMsg["merge feature"]; len(c.Files) != 0 {
		t.Errorf("merge has diffs: %+v", c.Files)
	}
}

// TestParseDiffsLimits feeds the parser output that the fixture can't
// produce: a pure rename, a diff over the per-file cap, invalid UTF-8 and
// content lines that look like headers.
func TestParseDiffsLimits(t *testing.T) {
	sha := strings.Repeat("a", 40)
	big := "@@ -0,0 +1 @@\n+" + strings.Repeat("x", maxFileDiffBytes) + "\n"
	in := "\x1e" + sha + "\x00\n" +
		":100644 100644 1 2 R100\x00old.txt\x00new.txt\x00" +
		":100644 100644 1 2 M\x00big.txt\x00" +
		":100644 100644 1 2 M\x00odd.txt\x00\x00" +
		"diff --git a/old.txt b/new.txt\nsimilarity index 100%\nrename from old.txt\nrename to new.txt\n" +
		"diff --git a/big.txt b/big.txt\nindex 1..2 100644\n--- a/big.txt\n+++ b/big.txt\n" + big +
		"diff --git a/odd.txt b/odd.txt\n--- a/odd.txt\n+++ b/odd.txt\n" +
		"@@ -1 +1 @@\n-diff --git a/x b/x\n+caf\xe9\x00\n" +
		"\x1e" + strings.Repeat("b", 40) + "\x00"
	var got []CommitDiffs
	if err := ParseDiffs(strings.NewReader(in), func(c CommitDiffs) error {
		got = append(got, c)
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 || len(got[0].Files) != 3 || len(got[1].Files) != 0 {
		t.Fatalf("got %+v", got)
	}
	rename, huge, odd := got[0].Files[0], got[0].Files[1], got[0].Files[2]
	if rename.Path != "new.txt" || rename.Diff != nil {
		t.Errorf("pure rename = %+v", rename)
	}
	if !huge.IsTruncated || int(huge.SizeBytes) != len(big) || deref(huge.Diff) != "@@ -0,0 +1 @@\n" {
		t.Errorf("big file: truncated=%v size=%d diff=%.40q", huge.IsTruncated, huge.SizeBytes, deref(huge.Diff))
	}
	if want := "@@ -1 +1 @@\n-diff --git a/x b/x\n+caf��\n"; deref(odd.Diff) != want {
		t.Errorf("odd.txt = %q, want %q", deref(odd.Diff), want)
	}

	// A patch with fewer sections than files is rejected.
	bad := "\x1e" + sha + "\x00\n:100644 100644 1 2 M\x00a\x00:100644 100644 1 2 M\x00b\x00\x00diff --git a/a b/a\n"
	if err := ParseDiffs(strings.NewReader(bad), func(CommitDiffs) error { return nil }); err == nil {
		t.Error("mismatched patch accepted")
	}
}

func deref(s *string) string {
	if s == nil {
		return "<nil>"
	}
	return *s
}

// ---- mirror.go ----

func TestMirroredRepositories(t *testing.T) {
	dir := t.TempDir()
	for _, name := range []string{"1.git", "42.git", "7.git.tmp-123", "notes.git"} {
		if err := os.Mkdir(filepath.Join(dir, name), 0o755); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(filepath.Join(dir, "3.git"), nil, 0o644); err != nil {
		t.Fatal(err)
	}
	ids, err := NewMirrors(dir, "git", nil).MirroredRepositories()
	if err != nil {
		t.Fatal(err)
	}
	// Clones in progress, other names and plain files are not mirrors.
	slices.Sort(ids)
	if !slices.Equal(ids, []int64{1, 42}) {
		t.Errorf("ids = %v", ids)
	}
	if ids, err := NewMirrors(filepath.Join(dir, "missing"), "git", nil).MirroredRepositories(); err != nil || ids != nil {
		t.Errorf("missing directory: %v, %v", ids, err)
	}
}

func TestMinedAt(t *testing.T) {
	at := time.Date(2024, 1, 2, 3, 4, 5, 0, time.UTC)
	if got := MinedAt(at); got == nil || !got.Equal(at) {
		t.Errorf("MinedAt(time) = %v", got)
	}
	if got := MinedAt(nil); got != nil {
		t.Errorf("MinedAt(nil) = %v", got)
	}
}

// ---- repository.go ----

func TestNormalizeURL(t *testing.T) {
	want := "https://github.com/foo/bar"
	for _, in := range []string{
		"https://github.com/foo/bar",
		"https://github.com/foo/bar.git",
		"https://GitHub.com/foo/bar/",
		"git@github.com:foo/bar.git",
		"ssh://git@github.com/foo/bar.git",
	} {
		got, host, path, err := NormalizeURL(in)
		if err != nil || got != want || host != "github.com" || path != "foo/bar" {
			t.Errorf("NormalizeURL(%q) = %q, %q, %q, %v", in, got, host, path, err)
		}
	}

	got, _, path, err := NormalizeURL("https://gitlab.com/group/sub/project.git")
	if err != nil || got != "https://gitlab.com/group/sub/project" || path != "group/sub/project" {
		t.Errorf("gitlab subgroup: %q %q %v", got, path, err)
	}

	for _, bad := range []string{"", "foo", "file:///tmp/repo", "https://github.com/", "https://github.com/foo", "https://x.com/a/../b"} {
		if _, _, _, err := NormalizeURL(bad); err == nil {
			t.Errorf("NormalizeURL(%q) should fail", bad)
		}
	}
}

// ---- datasets.go ----

func TestDatasetsAreValid(t *testing.T) {
	for _, d := range (&Platform{}).Datasets() {
		if err := d.Validate(); err != nil {
			t.Error(err)
		}
	}
}

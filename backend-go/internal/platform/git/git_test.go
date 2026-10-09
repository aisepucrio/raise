package git

import (
	"bytes"
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
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

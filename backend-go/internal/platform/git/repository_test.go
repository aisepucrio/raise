package git

import "testing"

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

package jobkit

import (
	"errors"
	"testing"
	"time"
	"unicode/utf8"
)

func TestSplitWindows(t *testing.T) {
	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := start.Add(70 * time.Hour)

	got := SplitWindows(start, end, 24*time.Hour)
	if len(got) != 3 {
		t.Fatalf("got %d windows, want 3", len(got))
	}
	if !got[0].Start.Equal(start) || !got[2].End.Equal(end) {
		t.Fatalf("windows don't cover range: %+v", got)
	}
	for i := 1; i < len(got); i++ {
		if !got[i].Start.Equal(got[i-1].End) {
			t.Fatalf("gap between windows %d and %d", i-1, i)
		}
	}
	if SplitWindows(end, start, time.Hour) != nil {
		t.Fatal("expected nil for empty range")
	}
}

func TestTruncateError(t *testing.T) {
	if got := truncateError(errors.New("short"), 10); got != "short" {
		t.Errorf("short message: got %q", got)
	}
	// "é" is two bytes: a cut at byte 4 would split it, so it moves back.
	got := truncateError(errors.New("abcéfgh"), 4)
	if got != "abc …" || !utf8.ValidString(got) {
		t.Errorf("long message: got %q, want %q", got, "abc …")
	}
}

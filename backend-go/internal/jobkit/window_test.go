package jobkit

import (
	"testing"
	"time"
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

package jobkit

import "time"

// Window is a half-open time interval [Start, End).
type Window struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// SplitWindows splits [start, end) into consecutive windows of at most step.
// Platforms use it to turn a large date range into independent page-planning jobs.
func SplitWindows(start, end time.Time, step time.Duration) []Window {
	if step <= 0 || !start.Before(end) {
		return nil
	}
	var out []Window
	for s := start; s.Before(end); s = s.Add(step) {
		out = append(out, Window{Start: s, End: earliest(s.Add(step), end)})
	}
	return out
}

func earliest(a, b time.Time) time.Time {
	if a.Before(b) {
		return a
	}
	return b
}

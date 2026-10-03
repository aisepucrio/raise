package git

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"
)

// logFormat emits one record per commit, starting with ASCII RS (0x1e) and
// with NUL-separated header fields. Combined with -z --raw --numstat, the
// header is followed by NUL-terminated raw entries and numstat entries.
const logFormat = "%x1e%H%x00%P%x00%an%x00%ae%x00%aI%x00%cn%x00%ce%x00%cI%x00%B%x00"

const headerFields = 9

// logArgs are the arguments to `git log` used to mine a batch of commits whose
// SHAs are given on stdin. Merge commits get no file list (--diff-merges=off).
func logArgs() []string {
	return []string{
		"-c", "core.quotePath=false",
		"log", "--no-walk=unsorted", "--stdin",
		"-z", "--raw", "--numstat", "--find-renames",
		"--diff-merges=off", "--no-color", "--no-ext-diff",
		"--format=" + logFormat,
	}
}

type LogEntry struct {
	SHA            string
	Parents        []string
	AuthorName     string
	AuthorEmail    string
	AuthoredAt     time.Time
	CommitterName  string
	CommitterEmail string
	CommittedAt    time.Time
	Message        string
	Files          []FileChange
}

type FileChange struct {
	Path       string
	OldPath    string // set for renames and copies
	Status     string // A, M, D, R, C, T, U
	Similarity *int32
	Additions  *int32 // nil for binary files
	Deletions  *int32
}

// ParseLog streams commits from `git log` output produced with logArgs.
func ParseLog(r io.Reader, fn func(LogEntry) error) error {
	sc := bufio.NewScanner(r)
	sc.Buffer(make([]byte, 0, 1<<20), 256<<20)
	sc.Split(splitRecords)
	for sc.Scan() {
		rec := sc.Bytes()
		if len(bytes.TrimSpace(rec)) == 0 {
			continue
		}
		e, err := parseRecord(rec)
		if err != nil {
			return err
		}
		if err := fn(e); err != nil {
			return err
		}
	}
	return sc.Err()
}

func splitRecords(data []byte, atEOF bool) (int, []byte, error) {
	start := 0
	if len(data) > 0 && data[0] == 0x1e {
		start = 1
	}
	if i := bytes.IndexByte(data[start:], 0x1e); i >= 0 {
		return start + i, data[start : start+i], nil
	}
	if atEOF && len(data) > start {
		return len(data), data[start:], nil
	}
	if atEOF {
		return len(data), nil, nil
	}
	return 0, nil, nil
}

func parseRecord(rec []byte) (LogEntry, error) {
	tok := bytes.Split(rec, []byte{0})
	if len(tok) < headerFields {
		return LogEntry{}, fmt.Errorf("git log: truncated record (%d fields)", len(tok))
	}
	e := LogEntry{
		SHA:            string(tok[0]),
		Parents:        strings.Fields(string(tok[1])),
		AuthorName:     string(tok[2]),
		AuthorEmail:    string(tok[3]),
		CommitterName:  string(tok[5]),
		CommitterEmail: string(tok[6]),
		Message:        strings.TrimRight(string(tok[8]), "\n"),
	}
	var err error
	if e.AuthoredAt, err = time.Parse(time.RFC3339, string(tok[4])); err != nil {
		return e, fmt.Errorf("commit %s: author date: %w", e.SHA, err)
	}
	if e.CommittedAt, err = time.Parse(time.RFC3339, string(tok[7])); err != nil {
		return e, fmt.Errorf("commit %s: committer date: %w", e.SHA, err)
	}

	byPath := map[string]int{}
	rest := tok[headerFields:]
	next := func(i int) string {
		if i < len(rest) {
			return string(rest[i])
		}
		return ""
	}
	for i := 0; i < len(rest); i++ {
		t := bytes.TrimLeft(rest[i], "\n")
		if len(t) == 0 {
			continue
		}
		switch {
		case t[0] == ':':
			// ":<mode> <mode> <sha> <sha> <status>" NUL <path> [NUL <new path>]
			fields := strings.Fields(string(t))
			status := fields[len(fields)-1]
			fc := FileChange{Status: status[:1], Path: next(i + 1)}
			i++
			if n, err := strconv.ParseInt(status[1:], 10, 32); err == nil {
				sim := int32(n)
				fc.Similarity = &sim
			}
			if fc.Status == "R" || fc.Status == "C" {
				fc.OldPath, fc.Path = fc.Path, next(i+1)
				i++
			}
			byPath[fc.Path] = len(e.Files)
			e.Files = append(e.Files, fc)
		case bytes.IndexByte(t, '\t') >= 0:
			// "<added>\t<deleted>\t<path>" or, for renames, "<a>\t<d>\t" NUL <old> NUL <new>
			parts := strings.SplitN(string(t), "\t", 3)
			if len(parts) != 3 {
				return e, fmt.Errorf("commit %s: bad numstat entry %q", e.SHA, t)
			}
			path := parts[2]
			if path == "" {
				path = next(i + 2)
				i += 2
			}
			if idx, ok := byPath[path]; ok {
				e.Files[idx].Additions = parseCount(parts[0])
				e.Files[idx].Deletions = parseCount(parts[1])
			}
		default:
			return e, fmt.Errorf("commit %s: unexpected token %q", e.SHA, t)
		}
	}
	return e, nil
}

func parseCount(s string) *int32 {
	n, err := strconv.ParseInt(s, 10, 32)
	if err != nil { // "-" for binary files
		return nil
	}
	v := int32(n)
	return &v
}

// Totals sums line changes over all non-binary files.
func (e LogEntry) Totals() (additions, deletions int32) {
	for _, f := range e.Files {
		if f.Additions != nil {
			additions += *f.Additions
		}
		if f.Deletions != nil {
			deletions += *f.Deletions
		}
	}
	return additions, deletions
}

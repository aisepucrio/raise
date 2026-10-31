package git

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"math"
	"strconv"
	"strings"
	"time"
)

// logFormat emits one record per commit, starting with ASCII RS (0x1e) and
// with NUL-separated header fields. Combined with -z --raw --numstat, the
// header is followed by NUL-terminated raw entries and numstat entries.
const logFormat = "%x1e%H%x00%P%x00%an%x00%ae%x00%aI%x00%cn%x00%ce%x00%cI%x00%B%x00"

const headerFields = 9

// diffOptions choose which files a commit changed. logArgs and diffArgs share
// them, so the files whose diffs are mined are the commit_files rows. Merge
// commits get no file list (--diff-merges=off).
var diffOptions = []string{"--find-renames", "--diff-merges=off", "--no-color", "--no-ext-diff"}

// logArgs are the arguments to `git log` used to mine a batch of commits whose
// SHAs are given on stdin.
func logArgs() []string {
	return append([]string{
		"-c", "core.quotePath=false",
		"log", "--no-walk=unsorted", "--stdin",
		"-z", "--raw", "--numstat",
		"--format=" + logFormat,
	}, diffOptions...)
}

// diffArgs are the arguments to `git log` used to mine the diffs of a batch of
// commits whose SHAs are given on stdin. Each record is RS, the SHA and NUL,
// then the NUL-separated --raw entries, which name the files in the order of
// their patches, then an empty token and the patch text. Options that user
// configuration could change (context lines, textconv) are fixed.
func diffArgs() []string {
	return append([]string{
		"-c", "core.quotePath=false",
		"log", "--no-walk=unsorted", "--stdin",
		"-z", "--raw", "--patch", "--unified=3", "--no-textconv",
		"--format=%x1e%H",
	}, diffOptions...)
}

type LogEntry struct {
	SHA            string
	ParentSHAs     []string
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
	Path              string
	PreviousPath      string // set for renamed and copied files
	ChangeType        string // see changeTypes
	SimilarityPercent *int32
	LinesAdded        *int32 // nil for binary files
	LinesDeleted      *int32
}

// changeTypes maps git's --raw status letters to the values stored in
// commit_files.change_type.
var changeTypes = map[byte]string{
	'A': "added",
	'M': "modified",
	'D': "deleted",
	'R': "renamed",
	'C': "copied",
	'T': "type_changed",
	'U': "unmerged",
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
		ParentSHAs:     strings.Fields(string(tok[1])),
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
			changeType, ok := changeTypes[status[0]]
			if !ok {
				return e, fmt.Errorf("commit %s: unknown change status %q", e.SHA, status)
			}
			fc := FileChange{ChangeType: changeType, Path: next(i + 1)}
			i++
			if n, err := strconv.ParseInt(status[1:], 10, 32); err == nil {
				sim := int32(n)
				fc.SimilarityPercent = &sim
			}
			if status[0] == 'R' || status[0] == 'C' {
				fc.PreviousPath, fc.Path = fc.Path, next(i+1)
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
				e.Files[idx].LinesAdded = parseCount(parts[0])
				e.Files[idx].LinesDeleted = parseCount(parts[1])
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
func (e LogEntry) Totals() (linesAdded, linesDeleted int32) {
	for _, f := range e.Files {
		if f.LinesAdded != nil {
			linesAdded += *f.LinesAdded
		}
		if f.LinesDeleted != nil {
			linesDeleted += *f.LinesDeleted
		}
	}
	return linesAdded, linesDeleted
}

const (
	// maxFileDiffBytes caps the diff stored for one file, and
	// maxCommitDiffBytes the diffs stored for one commit, which bounds a
	// batch's memory. Diffs are cut at a line boundary and marked truncated;
	// generated and vendored files are what usually exceed them.
	maxFileDiffBytes   = 1 << 20
	maxCommitDiffBytes = 32 << 20
)

// CommitDiffs is the diff of every file a commit changed, in the order of
// LogEntry.Files.
type CommitDiffs struct {
	SHA   string
	Files []FileDiff
}

type FileDiff struct {
	Path string
	// Diff is the unified diff's hunks, from the first "@@" line; nil when the
	// change has none (binary files, mode changes, pure renames).
	Diff        *string
	SizeBytes   int32 // of the whole diff, before truncation
	IsTruncated bool
}

// ParseDiffs streams commits' diffs from `git log` output produced with
// diffArgs. It reads the patch line by line and keeps at most the caps, so a
// huge diff never sits in memory.
func ParseDiffs(r io.Reader, fn func(CommitDiffs) error) error {
	br := bufio.NewReaderSize(r, 64<<10)
	for {
		b, err := br.ReadByte()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}
		if b == '\n' {
			continue
		}
		if b != 0x1e {
			return fmt.Errorf("git log --patch: unexpected byte %q between commits", b)
		}
		c, err := parseDiffRecord(br)
		if err != nil {
			return err
		}
		if err := fn(c); err != nil {
			return err
		}
	}
}

func parseDiffRecord(br *bufio.Reader) (CommitDiffs, error) {
	sha, err := readToken(br)
	if err != nil {
		return CommitDiffs{}, fmt.Errorf("git log --patch: %w", err)
	}
	c := CommitDiffs{SHA: sha}
	fail := func(format string, args ...any) (CommitDiffs, error) {
		return c, fmt.Errorf("commit %s: %s", sha, fmt.Sprintf(format, args...))
	}

	// The --raw entries: ":<mode> <mode> <sha> <sha> <status>" NUL <path> [NUL <new path>].
	var paths []string
raw:
	for {
		b, err := peekSkipping(br, '\n')
		switch {
		case err == io.EOF || (err == nil && b == 0x1e):
			if len(paths) > 0 {
				return fail("files without a patch")
			}
			return c, nil // a merge, or a commit that changes nothing
		case err != nil:
			return c, err
		case b == 0:
			_, _ = br.ReadByte() // the empty token that ends the entries
			break raw
		case b != ':':
			return fail("unexpected raw entry starting with %q", b)
		}
		status, err := readToken(br)
		if err != nil {
			return c, err
		}
		fields := strings.Fields(status)
		path, err := readToken(br)
		if err != nil {
			return c, err
		}
		if s := fields[len(fields)-1]; s[0] == 'R' || s[0] == 'C' {
			if path, err = readToken(br); err != nil {
				return c, err
			}
		}
		paths = append(paths, path)
	}

	// The patch: one "diff --git" section per file, in the order of the
	// entries. Hunk lines always start with " ", "+", "-", "\\" or "@@", so
	// neither a section header nor the next record's RS can be mistaken for
	// content.
	type section struct {
		buf       []byte
		size      int
		inHunk    bool
		truncated bool
	}
	var sections []*section
	budget := maxCommitDiffBytes
	for {
		b, err := br.Peek(1)
		if err == io.EOF || (err == nil && b[0] == 0x1e) {
			break
		}
		if err != nil {
			return c, err
		}
		line, size, err := readLine(br, maxFileDiffBytes)
		if err != nil {
			return c, err
		}
		if bytes.HasPrefix(line, []byte("diff --git ")) {
			sections = append(sections, &section{})
			continue
		}
		if len(sections) == 0 {
			return fail("patch text before the first file header")
		}
		cur := sections[len(sections)-1]
		if !cur.inHunk {
			if !bytes.HasPrefix(line, []byte("@@")) {
				continue // extended header, "---"/"+++" or "Binary files … differ"
			}
			cur.inHunk = true
		}
		cur.size += size
		if cur.truncated {
			continue
		}
		if len(line) < size || len(cur.buf)+size > maxFileDiffBytes || size > budget {
			cur.truncated = true
			continue
		}
		cur.buf = append(cur.buf, line...)
		budget -= size
	}

	if len(sections) != len(paths) {
		return fail("%d patches for %d files", len(sections), len(paths))
	}
	c.Files = make([]FileDiff, len(paths))
	for i, sec := range sections {
		fd := FileDiff{Path: paths[i], SizeBytes: int32(min(sec.size, math.MaxInt32)), IsTruncated: sec.truncated}
		if sec.inHunk {
			// PostgreSQL text can't hold NUL bytes or invalid UTF-8.
			d := strings.ToValidUTF8(strings.ReplaceAll(string(sec.buf), "\x00", "\uFFFD"), "\uFFFD")
			fd.Diff = &d
		}
		c.Files[i] = fd
	}
	return c, nil
}

// readToken reads up to the next NUL, which it consumes.
func readToken(br *bufio.Reader) (string, error) {
	s, err := br.ReadString(0)
	if err != nil {
		if err == io.EOF {
			return "", fmt.Errorf("truncated output")
		}
		return "", err
	}
	return s[:len(s)-1], nil
}

// peekSkipping discards bytes equal to skip and returns the next one.
func peekSkipping(br *bufio.Reader, skip byte) (byte, error) {
	for {
		b, err := br.Peek(1)
		if err != nil {
			return 0, err
		}
		if b[0] != skip {
			return b[0], nil
		}
		_, _ = br.ReadByte()
	}
}

// readLine reads a line with its newline (or the rest of the input) and
// returns at most keep bytes of it, and its full size.
func readLine(br *bufio.Reader, keep int) ([]byte, int, error) {
	var line []byte
	size := 0
	for {
		chunk, err := br.ReadSlice('\n')
		size += len(chunk)
		if room := keep - len(line); room > 0 {
			line = append(line, chunk[:min(len(chunk), room)]...)
		}
		switch err {
		case nil:
			return line, size, nil
		case bufio.ErrBufferFull:
			continue
		case io.EOF:
			return line, size, nil
		default:
			return nil, 0, err
		}
	}
}

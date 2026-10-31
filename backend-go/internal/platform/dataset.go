package platform

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"raise/internal/apperr"
	"raise/internal/httpapi"
)

// DatasetProvider is a platform whose mined tables can be previewed (a page
// of filtered, sorted rows) and exported (every matching row, as CSV, JSON or
// JSON Lines).
//
// Platforms only describe their datasets. RegisterDatasetRoutes serves every
// dataset at the same paths with the same parameters, derived from its
// columns, so the frontend renders and downloads all of them with the same
// code. The filters are dynamic, so the SQL is built here rather than by sqlc.
type DatasetProvider interface {
	Platform
	Datasets() []Dataset
}

// Dataset is a flat, filterable view of a platform's data: one row per row of
// a table, sometimes joined with related tables.
type Dataset struct {
	// Name is the URL segment, in kebab-case like the frontend's preview
	// sections: "issues", "pull-requests".
	Name string
	Doc  string
	// From is the FROM clause, with joins. Column expressions refer to it.
	From string
	// Where, when set, is a fixed condition every row satisfies.
	Where   string
	Columns []Column
	// TimeColumn is the column since and until apply to; rows are sorted by
	// it, newest first, unless sort says otherwise. Empty when the dataset
	// has no natural timestamp.
	TimeColumn string
	// Key is the columns that identify a row. They break ties in every sort,
	// so pages are stable.
	Key []string
}

type ColumnType string

const (
	ColText         ColumnType = "text"
	ColInteger      ColumnType = "integer"
	ColNumber       ColumnType = "number"
	ColBoolean      ColumnType = "boolean"
	ColTimestamp    ColumnType = "timestamp"
	ColTextArray    ColumnType = "text[]"
	ColIntegerArray ColumnType = "integer[]"
	ColJSON         ColumnType = "json"
)

// Column is one column of a dataset. Name is the JSON field and CSV header,
// and, like every API field, the name of the database column it comes from.
type Column struct {
	Name string
	Type ColumnType
	// Expr is the SQL expression; Name when empty.
	Expr string
	Doc  string
	// Enum lists the accepted filter values, when the set is known.
	Enum []string
	// Search includes the column in ?search=.
	Search bool
	// NoFilter hides the column's filter parameters, for long text such as
	// bodies that search covers instead.
	NoFilter bool
}

func col(name string, t ColumnType) Column { return Column{Name: name, Type: t} }

func TextCol(name string) Column      { return col(name, ColText) }
func IntCol(name string) Column       { return col(name, ColInteger) }
func NumberCol(name string) Column    { return col(name, ColNumber) }
func BoolCol(name string) Column      { return col(name, ColBoolean) }
func TimeCol(name string) Column      { return col(name, ColTimestamp) }
func TextArrayCol(name string) Column { return col(name, ColTextArray) }
func IntArrayCol(name string) Column  { return col(name, ColIntegerArray) }
func JSONCol(name string) Column      { return col(name, ColJSON) }

// LongTextCol is a text column that is searched rather than filtered or
// sorted, such as a title, body or message.
func LongTextCol(name string) Column {
	c := col(name, ColText)
	c.Search, c.NoFilter = true, true
	return c
}

func (c Column) Expression(sql string) Column { c.Expr = sql; return c }
func (c Column) Describe(doc string) Column   { c.Doc = doc; return c }
func (c Column) Searchable() Column           { c.Search = true; return c }
func (c Column) Values(v ...string) Column    { c.Enum = v; return c }

// expr is the column's SQL, parenthesized when it is compound so that it
// binds as one operand in conditions ("(a > 1) = $1").
func (c Column) expr() string {
	if c.Expr == "" {
		return c.Name
	}
	if strings.ContainsAny(c.Expr, " \t\n") {
		return "(" + c.Expr + ")"
	}
	return c.Expr
}

func (c Column) sortable() bool {
	return c.Type != ColJSON && c.Type != ColTextArray && c.Type != ColIntegerArray && !c.NoFilter
}

// filterParams are the query parameters that filter on c, in the order they
// are documented.
func (c Column) filterParams() []string {
	if c.NoFilter || c.Type == ColJSON {
		return nil
	}
	switch c.Type {
	case ColInteger:
		return []string{c.Name, c.Name + "_min", c.Name + "_max"}
	case ColNumber:
		return []string{c.Name + "_min", c.Name + "_max"}
	case ColTimestamp:
		return []string{c.Name + "_since", c.Name + "_until"}
	default:
		return []string{c.Name}
	}
}

// maxColumns is json_build_object's limit of 100 arguments, two per column.
const maxColumns = 50

// Validate checks a dataset's definition: unique column names, at most
// maxColumns columns, and a key and time column that exist.
func (d Dataset) Validate() error {
	if d.Name == "" || d.From == "" || len(d.Columns) == 0 || len(d.Key) == 0 {
		return fmt.Errorf("dataset %q: name, from, columns and key are required", d.Name)
	}
	if len(d.Columns) > maxColumns {
		return fmt.Errorf("dataset %s: %d columns, more than %d", d.Name, len(d.Columns), maxColumns)
	}
	seen := map[string]bool{}
	for _, c := range d.Columns {
		if seen[c.Name] {
			return fmt.Errorf("dataset %s: column %s twice", d.Name, c.Name)
		}
		seen[c.Name] = true
		for _, p := range c.filterParams() {
			if slices.Contains(reservedParams, p) {
				return fmt.Errorf("dataset %s: filter %s clashes with a reserved parameter", d.Name, p)
			}
		}
	}
	for _, k := range d.Key {
		if c, ok := d.column(k); !ok || !c.sortable() {
			return fmt.Errorf("dataset %s: key column %s missing or not sortable", d.Name, k)
		}
	}
	if d.TimeColumn != "" {
		if c, ok := d.column(d.TimeColumn); !ok || c.Type != ColTimestamp {
			return fmt.Errorf("dataset %s: time column %s missing or not a timestamp", d.Name, d.TimeColumn)
		}
	}
	return nil
}

func (d Dataset) column(name string) (Column, bool) {
	for _, c := range d.Columns {
		if c.Name == name {
			return c, true
		}
	}
	return Column{}, false
}

// previewTimeout bounds a preview's count and page. Exports are not bounded:
// they stream for as long as the client reads.
const previewTimeout = 30 * time.Second

// Parameters every dataset accepts, besides its column filters.
var reservedParams = []string{"since", "until", "search", "sort", "limit", "cursor", "format"}

// datasetQuery is a parsed request: the WHERE clause, its arguments and the
// ORDER BY clause.
type datasetQuery struct {
	where   []string
	args    []any
	orderBy string
	// order is orderBy as terms, which keyset cursors compare against.
	order []sortTerm
}

// sortTerm is one ORDER BY term. Every term sorts NULLS LAST.
type sortTerm struct {
	col  Column
	desc bool
}

func (q *datasetQuery) arg(v any) string {
	q.args = append(q.args, v)
	return "$" + strconv.Itoa(len(q.args))
}

// parseQuery turns the request's query string into SQL conditions. Unknown
// parameters are rejected, so a misspelt filter isn't silently ignored.
func (d Dataset) parseQuery(values url.Values) (datasetQuery, error) {
	q := datasetQuery{}
	if d.Where != "" {
		q.where = append(q.where, "("+d.Where+")")
	}

	params := map[string]Column{}
	for _, c := range d.Columns {
		for _, p := range c.filterParams() {
			params[p] = c
		}
	}

	names := make([]string, 0, len(values))
	for name := range values {
		names = append(names, name)
	}
	slices.Sort(names) // deterministic argument numbering and errors
	for _, name := range names {
		vs := values[name]
		if slices.Contains(reservedParams, name) {
			continue
		}
		c, ok := params[name]
		if !ok {
			return q, fmt.Errorf("%w: unknown parameter %q for dataset %s", apperr.ErrInvalid, name, d.Name)
		}
		cond, err := q.filter(c, strings.TrimPrefix(name, c.Name), vs)
		if err != nil {
			return q, fmt.Errorf("%w: %s: %w", apperr.ErrInvalid, name, err)
		}
		q.where = append(q.where, cond)
	}

	if since, until := values.Get("since"), values.Get("until"); since != "" || until != "" {
		if d.TimeColumn == "" {
			return q, fmt.Errorf("%w: dataset %s has no time column for since and until; filter on a column instead", apperr.ErrInvalid, d.Name)
		}
		c, _ := d.column(d.TimeColumn)
		for suffix, v := range map[string]string{"_since": since, "_until": until} {
			if v == "" {
				continue
			}
			cond, err := q.filter(c, suffix, []string{v})
			if err != nil {
				return q, fmt.Errorf("%w: %s: %w", apperr.ErrInvalid, strings.TrimPrefix(suffix, "_"), err)
			}
			q.where = append(q.where, cond)
		}
	}

	if s := values.Get("search"); s != "" {
		pattern := q.arg("%" + escapeLike(s) + "%")
		var ors []string
		for _, c := range d.Columns {
			if c.Search {
				ors = append(ors, c.expr()+" ILIKE "+pattern)
			}
		}
		if len(ors) == 0 {
			return q, fmt.Errorf("%w: dataset %s has no searchable columns", apperr.ErrInvalid, d.Name)
		}
		q.where = append(q.where, "("+strings.Join(ors, " OR ")+")")
	}

	order, err := d.orderBy(values.Get("sort"))
	if err != nil {
		return q, err
	}
	q.order = order
	terms := make([]string, len(order))
	for i, t := range order {
		dir := "ASC"
		if t.desc {
			dir = "DESC"
		}
		terms[i] = t.col.expr() + " " + dir + " NULLS LAST"
	}
	q.orderBy = strings.Join(terms, ", ")
	return q, nil
}

// filter builds the condition for one filter parameter: suffix is what
// follows the column name ("", "_min", "_since", …).
func (q *datasetQuery) filter(c Column, suffix string, vs []string) (string, error) {
	e := c.expr()
	single := func() (string, error) {
		if len(vs) != 1 {
			return "", fmt.Errorf("give one value, not %d", len(vs))
		}
		return vs[0], nil
	}
	switch c.Type {
	case ColText:
		for _, v := range vs {
			if len(c.Enum) > 0 && !slices.Contains(c.Enum, v) {
				return "", fmt.Errorf("%q is not one of %s", v, strings.Join(c.Enum, ", "))
			}
		}
		return e + " = ANY(" + q.arg(vs) + "::text[])", nil
	case ColBoolean:
		v, err := single()
		if err != nil {
			return "", err
		}
		b, err := strconv.ParseBool(v)
		if err != nil {
			return "", fmt.Errorf("%q is not true or false", v)
		}
		return e + " = " + q.arg(b), nil
	case ColInteger, ColNumber:
		parse := func(v string) (any, error) {
			if c.Type == ColInteger {
				return strconv.ParseInt(v, 10, 64)
			}
			return strconv.ParseFloat(v, 64)
		}
		if suffix == "" {
			ns := make([]int64, len(vs))
			for i, v := range vs {
				n, err := strconv.ParseInt(v, 10, 64)
				if err != nil {
					return "", fmt.Errorf("%q is not an integer", v)
				}
				ns[i] = n
			}
			return e + " = ANY(" + q.arg(ns) + "::bigint[])", nil
		}
		v, err := single()
		if err != nil {
			return "", err
		}
		n, err := parse(v)
		if err != nil {
			return "", fmt.Errorf("%q is not a %s", v, c.Type)
		}
		if suffix == "_min" {
			return e + " >= " + q.arg(n), nil
		}
		return e + " <= " + q.arg(n), nil
	case ColTimestamp:
		v, err := single()
		if err != nil {
			return "", err
		}
		t, err := parseTime(v)
		if err != nil {
			return "", err
		}
		if suffix == "_since" {
			return e + " >= " + q.arg(t), nil
		}
		return e + " < " + q.arg(t), nil
	case ColTextArray:
		return e + " @> " + q.arg(vs) + "::text[]", nil
	case ColIntegerArray:
		ns := make([]int64, len(vs))
		for i, v := range vs {
			n, err := strconv.ParseInt(v, 10, 32)
			if err != nil {
				return "", fmt.Errorf("%q is not an integer", v)
			}
			ns[i] = n
		}
		return e + " @> " + q.arg(ns) + "::integer[]", nil
	}
	return "", fmt.Errorf("column type %s can't be filtered", c.Type)
}

// parseTime accepts RFC 3339 timestamps and dates (YYYY-MM-DD, midnight UTC),
// which is what date inputs produce.
func parseTime(v string) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339, v); err == nil {
		return t, nil
	}
	if t, err := time.Parse(time.DateOnly, v); err == nil {
		return t, nil
	}
	return time.Time{}, fmt.Errorf("%q is not an RFC 3339 timestamp or a YYYY-MM-DD date", v)
}

func escapeLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
}

// orderBy parses sort ("-github_created_at,number": comma-separated columns,
// "-" for descending) and appends the key, so that the order is total and
// keyset pages are stable.
func (d Dataset) orderBy(sort string) ([]sortTerm, error) {
	var terms []sortTerm
	used := map[string]bool{}
	add := func(name string, desc bool) error {
		c, ok := d.column(name)
		if !ok || !c.sortable() {
			return fmt.Errorf("%w: can't sort %s by %q", apperr.ErrInvalid, d.Name, name)
		}
		if used[name] {
			return nil
		}
		used[name] = true
		terms = append(terms, sortTerm{col: c, desc: desc})
		return nil
	}

	if sort == "" && d.TimeColumn != "" {
		sort = "-" + d.TimeColumn
	}
	for _, s := range strings.Split(sort, ",") {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		if err := add(strings.TrimPrefix(s, "-"), strings.HasPrefix(s, "-")); err != nil {
			return nil, err
		}
	}
	for _, k := range d.Key {
		if err := add(k, false); err != nil {
			return nil, err
		}
	}
	return terms, nil
}

// sortKey is the order in sort's syntax, with the key appended. A cursor
// records it, so that it isn't used with another order.
func (q datasetQuery) sortKey() string {
	terms := make([]string, len(q.order))
	for i, t := range q.order {
		terms[i] = t.col.Name
		if t.desc {
			terms[i] = "-" + terms[i]
		}
	}
	return strings.Join(terms, ",")
}

// cursor is the position after a preview page: the sort and the values of
// the page's last row for each sort term. It is sent as opaque base64url
// JSON.
type cursor struct {
	Sort  string          `json:"s"`
	After json.RawMessage `json:"a"`
}

func encodeCursor(sort string, after []byte) (string, error) {
	b, err := json.Marshal(cursor{Sort: sort, After: after})
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// sqlTypes are the types cursor values are cast to, so that they compare
// as the column does.
var sqlTypes = map[ColumnType]string{
	ColText: "text", ColInteger: "bigint", ColNumber: "numeric", ColBoolean: "boolean", ColTimestamp: "timestamptz",
}

// after restricts q to the rows that follow the cursor in q's order. Each
// term may be descending and every term sorts NULLS LAST, so a row value
// comparison can't express it; the condition is expanded instead:
// (a after a0) OR (a = a0 AND b after b0) OR …
func (q *datasetQuery) after(encoded string) error {
	invalid := func(why string) error {
		return fmt.Errorf("%w: cursor: %s", apperr.ErrInvalid, why)
	}
	raw, err := base64.RawURLEncoding.DecodeString(encoded)
	if err != nil {
		return invalid("malformed")
	}
	var c cursor
	if err := json.Unmarshal(raw, &c); err != nil {
		return invalid("malformed")
	}
	if c.Sort != q.sortKey() {
		return invalid("made for another sort; start again without a cursor")
	}
	dec := json.NewDecoder(bytes.NewReader(c.After))
	dec.UseNumber()
	var values []any
	if err := dec.Decode(&values); err != nil || len(values) != len(q.order) {
		return invalid("malformed")
	}

	var ors, equal []string
	for i, t := range q.order {
		e := t.col.expr()
		if values[i] == nil {
			// Nulls sort last: only other nulls tie, and nothing follows.
			equal = append(equal, e+" IS NULL")
			continue
		}
		p := q.arg(fmt.Sprint(values[i])) + "::text::" + sqlTypes[t.col.Type]
		op := " > "
		if t.desc {
			op = " < "
		}
		follows := "(" + e + op + p + " OR " + e + " IS NULL)"
		ors = append(ors, "("+strings.Join(append(slices.Clone(equal), follows), " AND ")+")")
		equal = append(equal, e+" = "+p)
	}
	if len(ors) == 0 {
		q.where = append(q.where, "FALSE")
		return nil
	}
	q.where = append(q.where, "("+strings.Join(ors, " OR ")+")")
	return nil
}

// cursorSelect selects a row's values for each sort term, from which the
// next page's cursor is built.
func (q datasetQuery) cursorSelect() string {
	exprs := make([]string, len(q.order))
	for i, t := range q.order {
		exprs[i] = t.col.expr()
	}
	return "json_build_array(" + strings.Join(exprs, ", ") + ")"
}

func (d Dataset) fromWhere(q datasetQuery) string {
	s := " FROM " + d.From
	if len(q.where) > 0 {
		s += " WHERE " + strings.Join(q.where, " AND ")
	}
	return s
}

// jsonSelect selects each row as one JSON object, with the columns in order.
func (d Dataset) jsonSelect() string {
	parts := make([]string, 0, 2*len(d.Columns))
	for _, c := range d.Columns {
		parts = append(parts, "'"+c.Name+"'", c.expr())
	}
	return "SELECT json_build_object(" + strings.Join(parts, ", ") + ")"
}

// csvSelect selects one value per column. Arrays and JSON are rendered as
// JSON text, since CSV has no nesting.
func (d Dataset) csvSelect() string {
	parts := make([]string, 0, len(d.Columns))
	for _, c := range d.Columns {
		e := c.expr()
		switch c.Type {
		case ColJSON, ColTextArray, ColIntegerArray:
			e = "to_json(" + e + ")::text"
		}
		parts = append(parts, e+" AS "+pgx.Identifier{c.Name}.Sanitize())
	}
	return "SELECT " + strings.Join(parts, ", ")
}

// readTx opens the read-only transaction a preview or export runs in: one
// snapshot for the count and the rows, and UTC timestamps in JSON.
func readTx(ctx context.Context, db *pgxpool.Pool, timeout time.Duration) (pgx.Tx, error) {
	tx, err := db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return nil, err
	}
	stmts := []string{"SET LOCAL TimeZone = 'UTC'"}
	if timeout > 0 {
		stmts = append(stmts, "SET LOCAL statement_timeout = "+strconv.FormatInt(timeout.Milliseconds(), 10))
	}
	for _, s := range stmts {
		if _, err := tx.Exec(ctx, s); err != nil {
			_ = tx.Rollback(ctx)
			return nil, err
		}
	}
	return tx, nil
}

// DatasetInfo describes a dataset for clients that render any of them.
type DatasetInfo struct {
	Name        string       `json:"name" example:"issues"`
	Description string       `json:"description"`
	TimeColumn  *string      `json:"time_column" doc:"The column since and until apply to, and the default sort (newest first); null if none"`
	Key         []string     `json:"key" doc:"Columns that identify a row"`
	Columns     []ColumnInfo `json:"columns" doc:"In the order of the JSON fields and CSV columns"`
}

type ColumnInfo struct {
	Name        string     `json:"name"`
	Type        ColumnType `json:"type" enum:"text,integer,number,boolean,timestamp,text[],integer[],json"`
	Description string     `json:"description,omitempty"`
	Values      []string   `json:"values,omitempty" doc:"The accepted values, when the set is known"`
	Filters     []string   `json:"filters" doc:"Query parameters that filter on this column"`
	Sortable    bool       `json:"sortable"`
	Searchable  bool       `json:"searchable" doc:"Whether search matches this column"`
}

func (d Dataset) Info() DatasetInfo {
	info := DatasetInfo{Name: d.Name, Description: d.Doc, Key: d.Key, Columns: make([]ColumnInfo, 0, len(d.Columns))}
	if d.TimeColumn != "" {
		info.TimeColumn = &d.TimeColumn
	}
	for _, c := range d.Columns {
		filters := c.filterParams()
		if filters == nil {
			filters = []string{}
		}
		info.Columns = append(info.Columns, ColumnInfo{
			Name: c.Name, Type: c.Type, Description: c.Doc, Values: c.Enum,
			Filters: filters, Sortable: c.sortable(), Searchable: c.Search,
		})
	}
	return info
}

type DatasetPage struct {
	Platform   ID                `json:"platform"`
	Dataset    string            `json:"dataset"`
	Count      int64             `json:"count" doc:"Rows matching the filters, across all pages"`
	Limit      int32             `json:"limit"`
	NextCursor *string           `json:"next_cursor" doc:"Pass as cursor, with the same filters and sort, for the next page; null on the last page"`
	Results    []json.RawMessage `json:"results" doc:"One object per row, with the dataset's columns in order"`
}

type previewInput struct {
	Search string `query:"search" doc:"Case-insensitive substring match on the dataset's searchable columns"`
	Sort   string `query:"sort" doc:"Comma-separated columns, each optionally prefixed with - for descending. Defaults to the time column, newest first; the key columns always break ties" example:"-github_created_at"`
	Limit  int32  `query:"limit" minimum:"1" maximum:"1000" default:"50"`
	Cursor string `query:"cursor" doc:"The previous page's next_cursor; omit for the first page. Only valid with the sort it was made for"`
	values url.Values
}

func (in *previewInput) Resolve(ctx huma.Context) []error {
	u := ctx.URL()
	in.values = u.Query()
	return nil
}

type exportInput struct {
	Format string `query:"format" enum:"csv,json,jsonl" default:"csv" doc:"csv (arrays and JSON as JSON text), json (one array) or jsonl (one object per line)"`
	Search string `query:"search" doc:"Case-insensitive substring match on the dataset's searchable columns"`
	Sort   string `query:"sort" doc:"Comma-separated columns, each optionally prefixed with - for descending. Defaults to the time column, newest first; the key columns always break ties"`
	values url.Values
}

func (in *exportInput) Resolve(ctx huma.Context) []error {
	u := ctx.URL()
	in.values = u.Query()
	return nil
}

// RegisterDatasetRoutes serves p's datasets:
//
//   - GET /api/{platform}/preview: the datasets and their columns;
//   - GET /api/{platform}/preview/{dataset}: a page of rows;
//   - GET /api/{platform}/export/{dataset}: every matching row, streamed.
//
// Both take the same filters, so an export downloads what the preview shows.
func RegisterDatasetRoutes(api huma.API, db *pgxpool.Pool, p DatasetProvider) {
	id := string(p.ID())
	datasets := p.Datasets()

	huma.Register(api, huma.Operation{
		OperationID: id + "-list-datasets", Method: http.MethodGet, Path: "/api/" + id + "/preview",
		Summary: "List the " + id + " datasets that can be previewed and exported", Tags: []string{"preview"},
	}, func(context.Context, *struct{}) (*struct{ Body []DatasetInfo }, error) {
		out := make([]DatasetInfo, 0, len(datasets))
		for _, d := range datasets {
			out = append(out, d.Info())
		}
		return &struct{ Body []DatasetInfo }{out}, nil
	})

	for _, d := range datasets {
		if err := d.Validate(); err != nil {
			panic(err) // a programming error, caught by the platforms' tests
		}
		registerPreview(api, db, p.ID(), d)
		registerExport(api, db, p.ID(), d)
	}
}

func registerPreview(api huma.API, db *pgxpool.Pool, id ID, d Dataset) {
	huma.Register(api, huma.Operation{
		OperationID: string(id) + "-preview-" + d.Name, Method: http.MethodGet,
		Path:    "/api/" + string(id) + "/preview/" + d.Name,
		Summary: "Preview " + string(id) + " " + d.Name, Description: d.Doc,
		Tags: []string{"preview"}, Parameters: d.filterDocs(),
	}, func(ctx context.Context, in *previewInput) (*struct{ Body DatasetPage }, error) {
		q, err := d.parseQuery(in.values)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		// The count covers every page, so it is taken without the cursor.
		countSQL, countArgs := "SELECT count(*)"+d.fromWhere(q), slices.Clone(q.args)
		if in.Cursor != "" {
			if err := q.after(in.Cursor); err != nil {
				return nil, httpapi.Error(err)
			}
		}
		page := DatasetPage{Platform: id, Dataset: d.Name, Limit: in.Limit, Results: []json.RawMessage{}}

		tx, err := readTx(ctx, db, previewTimeout)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		defer func() { _ = tx.Rollback(ctx) }()

		if err := tx.QueryRow(ctx, countSQL, countArgs...).Scan(&page.Count); err != nil {
			return nil, httpapi.Error(err)
		}
		// One row more than the page tells whether there is a next one.
		args := append(slices.Clone(q.args), in.Limit+1)
		sql := d.jsonSelect() + ", " + q.cursorSelect() + d.fromWhere(q) + " ORDER BY " + q.orderBy +
			fmt.Sprintf(" LIMIT $%d", len(args))
		rows, err := tx.Query(ctx, sql, args...)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		var last []byte
		for rows.Next() {
			var row, after []byte
			if err := rows.Scan(&row, &after); err != nil {
				rows.Close()
				return nil, httpapi.Error(err)
			}
			if len(page.Results) == int(in.Limit) {
				next, err := encodeCursor(q.sortKey(), last)
				if err != nil {
					rows.Close()
					return nil, httpapi.Error(err)
				}
				page.NextCursor = &next
				break
			}
			page.Results = append(page.Results, row)
			last = after
		}
		rows.Close()
		if err := rows.Err(); err != nil {
			return nil, httpapi.Error(err)
		}
		return &struct{ Body DatasetPage }{page}, nil
	})
}

var exportContentTypes = map[string]string{
	"csv":   "text/csv; charset=utf-8",
	"json":  "application/json",
	"jsonl": "application/x-ndjson",
}

func registerExport(api huma.API, db *pgxpool.Pool, id ID, d Dataset) {
	content := map[string]*huma.MediaType{}
	for _, ct := range exportContentTypes {
		content[strings.Split(ct, ";")[0]] = &huma.MediaType{}
	}
	huma.Register(api, huma.Operation{
		OperationID: string(id) + "-export-" + d.Name, Method: http.MethodGet,
		Path:        "/api/" + string(id) + "/export/" + d.Name,
		Summary:     "Export " + string(id) + " " + d.Name,
		Description: d.Doc + "\n\nTakes the same filters as the preview and streams every matching row as an attachment.",
		Tags:        []string{"export"}, Parameters: d.filterDocs(),
		Responses: map[string]*huma.Response{
			"200": {Description: "The rows, as an attachment", Content: content},
		},
	}, func(ctx context.Context, in *exportInput) (*huma.StreamResponse, error) {
		q, err := d.parseQuery(in.values)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		sel := d.jsonSelect()
		if in.Format == "csv" {
			sel = d.csvSelect()
		}
		// Run the query before answering, so that a failure is still an
		// error status rather than a truncated file.
		tx, err := readTx(ctx, db, 0)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		rows, err := tx.Query(ctx, sel+d.fromWhere(q)+" ORDER BY "+q.orderBy, q.args...)
		if err != nil {
			_ = tx.Rollback(ctx)
			return nil, httpapi.Error(err)
		}

		filename := fmt.Sprintf("%s_%s_%s.%s", id, strings.ReplaceAll(d.Name, "-", "_"),
			time.Now().UTC().Format("20060102T150405Z"), in.Format)
		return &huma.StreamResponse{Body: func(hctx huma.Context) {
			defer func() { _ = tx.Rollback(ctx) }()
			defer rows.Close()
			hctx.SetHeader("Content-Type", exportContentTypes[in.Format])
			hctx.SetHeader("Content-Disposition", `attachment; filename="`+filename+`"`)
			hctx.SetStatus(http.StatusOK)

			var err error
			if in.Format == "csv" {
				err = writeCSV(hctx.BodyWriter(), d, rows)
			} else {
				err = writeJSON(hctx.BodyWriter(), in.Format == "jsonl", rows)
			}
			if err != nil {
				// The status is sent; the client sees a truncated file.
				slog.ErrorContext(ctx, "export failed", "platform", id, "dataset", d.Name, "error", err)
			}
		}}, nil
	})
}

type flusher interface{ Flush() }

// flushEvery is how many rows an export writes between flushes, so that a
// large download starts promptly and doesn't buffer in memory.
const flushEvery = 1000

func writeJSON(w interface{ Write([]byte) (int, error) }, lines bool, rows pgx.Rows) error {
	sep, open, end := []byte(",\n"), []byte("[\n"), []byte("\n]\n")
	if lines {
		sep, open, end = []byte("\n"), nil, []byte("\n")
	}
	if _, err := w.Write(open); err != nil {
		return err
	}
	n := 0
	for rows.Next() {
		var row []byte
		if err := rows.Scan(&row); err != nil {
			return err
		}
		if n > 0 {
			if _, err := w.Write(sep); err != nil {
				return err
			}
		}
		if _, err := w.Write(row); err != nil {
			return err
		}
		n++
		if f, ok := w.(flusher); ok && n%flushEvery == 0 {
			f.Flush()
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if n == 0 && lines {
		return nil
	}
	if n == 0 {
		end = []byte("]\n")
	}
	_, err := w.Write(end)
	return err
}

func writeCSV(w interface{ Write([]byte) (int, error) }, d Dataset, rows pgx.Rows) error {
	cw := csv.NewWriter(w)
	header := make([]string, len(d.Columns))
	for i, c := range d.Columns {
		header[i] = c.Name
	}
	if err := cw.Write(header); err != nil {
		return err
	}
	record := make([]string, len(d.Columns))
	n := 0
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			return err
		}
		for i, v := range values {
			record[i] = csvValue(v)
		}
		if err := cw.Write(record); err != nil {
			return err
		}
		n++
		if n%flushEvery == 0 {
			cw.Flush()
			if err := cw.Error(); err != nil {
				return err
			}
			if f, ok := w.(flusher); ok {
				f.Flush()
			}
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	cw.Flush()
	return cw.Error()
}

// csvValue renders a scanned value. NULL is an empty field.
func csvValue(v any) string {
	switch v := v.(type) {
	case nil:
		return ""
	case string:
		return v
	case time.Time:
		return v.UTC().Format(time.RFC3339Nano)
	case bool:
		return strconv.FormatBool(v)
	default:
		return fmt.Sprint(v)
	}
}

// filterDocs documents the dataset's query parameters. The handlers read
// them from the raw query string, because they differ per dataset.
func (d Dataset) filterDocs() []*huma.Param {
	var out []*huma.Param
	if d.TimeColumn != "" {
		out = append(out,
			&huma.Param{Name: "since", In: "query", Schema: &huma.Schema{Type: "string"},
				Description: "Only rows whose " + d.TimeColumn + " is at or after this time (RFC 3339, or YYYY-MM-DD for midnight UTC)"},
			&huma.Param{Name: "until", In: "query", Schema: &huma.Schema{Type: "string"},
				Description: "Only rows whose " + d.TimeColumn + " is before this time (RFC 3339, or YYYY-MM-DD for midnight UTC)"},
		)
	}
	for _, c := range d.Columns {
		for _, name := range c.filterParams() {
			p := &huma.Param{Name: name, In: "query"}
			switch suffix := strings.TrimPrefix(name, c.Name); {
			case suffix == "_min":
				p.Description = "Only rows whose " + c.Name + " is at least this value"
				p.Schema = &huma.Schema{Type: elemType(c.Type)}
			case suffix == "_max":
				p.Description = "Only rows whose " + c.Name + " is at most this value"
				p.Schema = &huma.Schema{Type: elemType(c.Type)}
			case suffix == "_since":
				p.Description = "Only rows whose " + c.Name + " is at or after this time (RFC 3339 or YYYY-MM-DD)"
				p.Schema = &huma.Schema{Type: "string"}
			case suffix == "_until":
				p.Description = "Only rows whose " + c.Name + " is before this time (RFC 3339 or YYYY-MM-DD)"
				p.Schema = &huma.Schema{Type: "string"}
			case c.Type == ColBoolean:
				p.Description = "Only rows whose " + c.Name + " is this value"
				p.Schema = &huma.Schema{Type: "boolean"}
			case c.Type == ColTextArray || c.Type == ColIntegerArray:
				p.Description = "Only rows whose " + c.Name + " contains every given value (repeat the parameter for several)"
				p.Schema = &huma.Schema{Type: "array", Items: &huma.Schema{Type: elemType(c.Type)}}
				p.Explode = new(bool)
				*p.Explode = true
			default:
				p.Description = "Only rows whose " + c.Name + " is one of the given values (repeat the parameter for several)"
				p.Schema = &huma.Schema{Type: "array", Items: &huma.Schema{Type: elemType(c.Type), Enum: enumAny(c.Enum)}}
				p.Explode = new(bool)
				*p.Explode = true
			}
			if c.Doc != "" {
				p.Description += ". " + c.Name + ": " + c.Doc
			}
			out = append(out, p)
		}
	}
	return out
}

func elemType(t ColumnType) string {
	switch t {
	case ColInteger, ColIntegerArray:
		return "integer"
	case ColNumber:
		return "number"
	default:
		return "string"
	}
}

func enumAny(vs []string) []any {
	if len(vs) == 0 {
		return nil
	}
	out := make([]any, len(vs))
	for i, v := range vs {
		out[i] = v
	}
	return out
}

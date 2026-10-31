package platform

import (
	"context"
	"encoding/json"
	"errors"
	"net/url"
	"reflect"
	"slices"
	"testing"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/humatest"
	"github.com/riverqueue/river"

	"raise/internal/apperr"
)

// --- dashboard.go ---

func date(y int, m time.Month, d int) time.Time {
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

func TestIntervalTrunc(t *testing.T) {
	// A Sunday evening in UTC-3 is Monday 02:00 UTC: buckets are UTC.
	at := time.Date(2024, 3, 17, 23, 0, 0, 0, time.FixedZone("BRT", -3*3600))
	cases := map[Interval]time.Time{
		Day:   date(2024, 3, 18),
		Week:  date(2024, 3, 18),
		Month: date(2024, 3, 1),
		Year:  date(2024, 1, 1),
	}
	for i, want := range cases {
		if got := i.Trunc(at); !got.Equal(want) {
			t.Errorf("%s: got %s, want %s", i, got, want)
		}
	}
	// Weeks start on Monday, as in PostgreSQL's date_trunc.
	if got := Week.Trunc(date(2024, 3, 17)); !got.Equal(date(2024, 3, 11)) {
		t.Errorf("week of Sunday 2024-03-17: got %s", got)
	}
}

func TestBuildGraphs(t *testing.T) {
	points := Points{}
	points.Add("opened", date(2023, 11, 1), 4) // before since
	points.Add("opened", date(2024, 1, 1), 1)
	points.Add("opened", date(2024, 3, 1), 2)
	points.Add("closed", date(2024, 2, 1), 5)
	since, until := date(2024, 1, 15), date(2024, 4, 1)
	f := GraphFilter{DashboardFilter: DashboardFilter{Since: &since, Until: &until}, Interval: Month}

	got, err := BuildGraphs(f, nil, points,
		GraphSpec{Key: "activity", Series: []SeriesSpec{{Key: "opened"}, {Key: "closed"}, {Key: "missing"}}},
		GraphSpec{Key: "growth", Cumulative: true, Series: []SeriesSpec{{Key: "opened"}}},
	)
	if err != nil {
		t.Fatal(err)
	}
	// Until is exclusive, so April isn't a bucket; gaps are filled.
	if want := []string{"2024-01-01", "2024-02-01", "2024-03-01"}; !reflect.DeepEqual(got.Buckets, want) {
		t.Fatalf("buckets: got %v, want %v", got.Buckets, want)
	}
	values := func(g, s int) []float64 { return got.Graphs[g].Series[s].Values }
	if want := []float64{1, 0, 2}; !reflect.DeepEqual(values(0, 0), want) {
		t.Errorf("opened: got %v, want %v", values(0, 0), want)
	}
	if want := []float64{0, 5, 0}; !reflect.DeepEqual(values(0, 1), want) {
		t.Errorf("closed: got %v, want %v", values(0, 1), want)
	}
	if want := []float64{0, 0, 0}; !reflect.DeepEqual(values(0, 2), want) {
		t.Errorf("missing series: got %v, want zeros", values(0, 2))
	}
	// The cumulative series starts from the 4 opened before since.
	if want := []float64{5, 5, 7}; !reflect.DeepEqual(values(1, 0), want) {
		t.Errorf("cumulative: got %v, want %v", values(1, 0), want)
	}
}

func TestBuildGraphsBounds(t *testing.T) {
	points := Points{}
	points.Add("x", date(2024, 1, 3), 1)
	points.Add("x", date(2024, 1, 1), 1)

	got, err := BuildGraphs(GraphFilter{Interval: Day}, nil, points, GraphSpec{Series: []SeriesSpec{{Key: "x"}}})
	if err != nil {
		t.Fatal(err)
	}
	if want := []string{"2024-01-01", "2024-01-02", "2024-01-03"}; !reflect.DeepEqual(got.Buckets, want) {
		t.Errorf("without since/until the buckets span the points: got %v", got.Buckets)
	}

	empty, err := BuildGraphs(GraphFilter{Interval: Day}, nil, Points{}, GraphSpec{Series: []SeriesSpec{{Key: "x"}}})
	if err != nil {
		t.Fatal(err)
	}
	if len(empty.Buckets) != 0 || len(empty.Graphs[0].Series[0].Values) != 0 {
		t.Errorf("no data should give no buckets: %+v", empty)
	}

	old := Points{}
	old.Add("x", date(1970, 1, 1), 1)
	old.Add("x", date(2024, 1, 1), 1)
	if _, err := BuildGraphs(GraphFilter{Interval: Day}, nil, old); !errors.Is(err, apperr.ErrInvalid) {
		t.Errorf("more than MaxBuckets days: got %v, want ErrInvalid", err)
	}
}

func TestDashboardFilter(t *testing.T) {
	if id, err := (DashboardFilter{}).EntityID(); id != nil || err != nil {
		t.Errorf("empty entity: got %v, %v", id, err)
	}
	if id, err := (DashboardFilter{Entity: "42"}).EntityID(); err != nil || *id != 42 {
		t.Errorf("entity 42: got %v, %v", id, err)
	}
	for _, bad := range []string{"abc", "0", "-1"} {
		if _, err := (DashboardFilter{Entity: bad}).EntityID(); !errors.Is(err, apperr.ErrInvalid) {
			t.Errorf("entity %q: got %v, want ErrInvalid", bad, err)
		}
	}

	in := dashboardInput{Since: date(2024, 2, 1), Until: date(2024, 1, 1)}
	if _, err := in.filter(); !errors.Is(err, apperr.ErrInvalid) {
		t.Errorf("since after until: got %v, want ErrInvalid", err)
	}
	f, err := dashboardInput{Since: date(2024, 1, 1)}.filter()
	if err != nil || f.Since == nil || f.Until != nil {
		t.Errorf("only since: got %+v, %v", f, err)
	}
}

// fakeDashboard records the filters the routes pass it.
type fakeDashboard struct {
	dashboard DashboardFilter
	graph     GraphFilter
	dateRange DashboardFilter
}

func (*fakeDashboard) ID() ID                               { return "fake" }
func (*fakeDashboard) RegisterWorkers(*river.Workers)       {}
func (*fakeDashboard) Queues() map[string]river.QueueConfig { return nil }
func (*fakeDashboard) RegisterRoutes(huma.API)              {}

func (d *fakeDashboard) Dashboard(_ context.Context, f DashboardFilter) (Dashboard, error) {
	d.dashboard = f
	return Dashboard{Cards: []DashboardCard{IntCard("things", "Things", 3)}}, nil
}

func (d *fakeDashboard) DashboardGraphs(_ context.Context, f GraphFilter) (DashboardGraphs, error) {
	d.graph = f
	return BuildGraphs(f, nil, Points{})
}

func (d *fakeDashboard) DashboardDateRange(_ context.Context, f DashboardFilter) (DashboardDateRange, error) {
	d.dateRange = f
	first := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	return DashboardDateRange{FirstAt: &first}, nil
}

func TestDashboardRoutes(t *testing.T) {
	_, api := humatest.New(t)
	d := &fakeDashboard{}
	RegisterDashboardRoutes(api, d)

	resp := api.Get("/api/fake/dashboard?entity=7&since=2024-01-01T00:00:00Z")
	if resp.Code != 200 {
		t.Fatalf("dashboard: %d %s", resp.Code, resp.Body)
	}
	var out Dashboard
	if err := json.Unmarshal(resp.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if out.Platform != "fake" || out.Entities == nil || len(out.Cards) != 1 {
		t.Errorf("dashboard response: %+v", out)
	}
	if d.dashboard.Entity != "7" || d.dashboard.Since == nil || d.dashboard.Until != nil {
		t.Errorf("dashboard filter: %+v", d.dashboard)
	}

	// Every input must reach the graph filter too, interval included.
	resp = api.Get("/api/fake/dashboard/graph?entity=7&until=2024-02-01T00:00:00Z&interval=week")
	if resp.Code != 200 {
		t.Fatalf("graph: %d %s", resp.Code, resp.Body)
	}
	if d.graph.Entity != "7" || d.graph.Until == nil || d.graph.Interval != Week {
		t.Errorf("graph filter: %+v", d.graph)
	}
	if api.Get("/api/fake/dashboard/graph"); d.graph.Interval != Month {
		t.Errorf("default interval: got %q, want month", d.graph.Interval)
	}
	if resp := api.Get("/api/fake/dashboard?since=2024-02-01T00:00:00Z&until=2024-01-01T00:00:00Z"); resp.Code != 422 {
		t.Errorf("since after until: got %d, want 422", resp.Code)
	}

	resp = api.Get("/api/fake/dashboard/date-range?entity=7")
	if resp.Code != 200 {
		t.Fatalf("date range: %d %s", resp.Code, resp.Body)
	}
	var dr DashboardDateRange
	if err := json.Unmarshal(resp.Body.Bytes(), &dr); err != nil {
		t.Fatal(err)
	}
	if dr.Platform != "fake" || dr.FirstAt == nil || dr.LastAt != nil || d.dateRange.Entity != "7" {
		t.Errorf("date range: %+v, filter %+v", dr, d.dateRange)
	}
}

// --- dataset.go ---

var testDataset = Dataset{
	Name:  "things",
	From:  "things t",
	Where: "NOT t.hidden",
	Columns: []Column{
		IntCol("id"),
		TextCol("state").Values("open", "closed"),
		TextCol("login").Searchable(),
		LongTextCol("body"),
		NumberCol("score"),
		BoolCol("is_big"),
		TextArrayCol("labels"),
		JSONCol("extra"),
		TimeCol("created_at").Expression("t.created"),
	},
	TimeColumn: "created_at",
	Key:        []string{"id"},
}

func parse(t *testing.T, query string) (datasetQuery, error) {
	t.Helper()
	values, err := url.ParseQuery(query)
	if err != nil {
		t.Fatal(err)
	}
	return testDataset.parseQuery(values)
}

func TestDatasetParseQuery(t *testing.T) {
	q, err := parse(t, "state=open&state=closed&id_min=3&is_big=true&labels=bug&created_at_since=2024-01-01"+
		"&until=2024-02-01T00:00:00Z&search=50%25_off&sort=-score,login&limit=10")
	if err != nil {
		t.Fatal(err)
	}
	wantWhere := []string{
		"(NOT t.hidden)",
		"t.created >= $1",
		"id >= $2",
		"is_big = $3",
		"labels @> $4::text[]",
		"state = ANY($5::text[])",
		"t.created < $6",
		"(login ILIKE $7 OR body ILIKE $7)",
	}
	if !reflect.DeepEqual(q.where, wantWhere) {
		t.Errorf("where:\n got %q\nwant %q", q.where, wantWhere)
	}
	wantArgs := []any{date(2024, 1, 1), int64(3), true, []string{"bug"}, []string{"open", "closed"},
		date(2024, 2, 1), `%50\%\_off%`}
	if !reflect.DeepEqual(q.args, wantArgs) {
		t.Errorf("args:\n got %#v\nwant %#v", q.args, wantArgs)
	}
	if want := "score DESC NULLS LAST, login ASC NULLS LAST, id ASC NULLS LAST"; q.orderBy != want {
		t.Errorf("order by: got %q, want %q", q.orderBy, want)
	}

	// Without sort, the newest rows come first.
	q, err = parse(t, "")
	if err != nil {
		t.Fatal(err)
	}
	if want := "t.created DESC NULLS LAST, id ASC NULLS LAST"; q.orderBy != want {
		t.Errorf("default order by: got %q, want %q", q.orderBy, want)
	}
}

func TestDatasetParseQueryRejects(t *testing.T) {
	for _, query := range []string{
		"stat=open",    // unknown parameter
		"state=merged", // not in the enum
		"body=x",       // long text is searched, not filtered
		"extra=1",      // JSON can't be filtered
		"id=abc",       // not an integer
		"is_big=true&is_big=false",
		"created_at_since=yesterday",
		"sort=body",   // long text isn't sortable
		"sort=labels", // nor are arrays
		"sort=nope",
	} {
		_, err := parse(t, query)
		if !errors.Is(err, apperr.ErrInvalid) {
			t.Errorf("%s: got %v, want ErrInvalid", query, err)
		}
	}
}

func TestDatasetSelects(t *testing.T) {
	d := Dataset{Columns: []Column{IntCol("id"), TextArrayCol("labels"), TimeCol("created_at").Expression("t.created")}}
	if got, want := d.jsonSelect(), "SELECT json_build_object('id', id, 'labels', labels, 'created_at', t.created)"; got != want {
		t.Errorf("json select: got %q, want %q", got, want)
	}
	if got, want := d.csvSelect(), `SELECT id AS "id", to_json(labels)::text AS "labels", t.created AS "created_at"`; got != want {
		t.Errorf("csv select: got %q, want %q", got, want)
	}
}

func TestDatasetValidate(t *testing.T) {
	if err := testDataset.Validate(); err != nil {
		t.Fatal(err)
	}
	bad := testDataset
	bad.Columns = append(slices.Clone(testDataset.Columns), IntCol("id"))
	if bad.Validate() == nil {
		t.Error("duplicate column accepted")
	}
	bad = testDataset
	bad.TimeColumn = "id"
	if bad.Validate() == nil {
		t.Error("non-timestamp time column accepted")
	}
	bad = testDataset
	bad.Key = []string{"body"}
	if bad.Validate() == nil {
		t.Error("unsortable key accepted")
	}
}

func TestCSVValue(t *testing.T) {
	at := time.Date(2024, 3, 1, 12, 0, 0, 0, time.FixedZone("BRT", -3*3600))
	for v, want := range map[any]string{nil: "", "a,b": "a,b", true: "true", int32(7): "7", 1.5: "1.5", at: "2024-03-01T15:00:00Z"} {
		if got := csvValue(v); got != want {
			t.Errorf("csvValue(%v): got %q, want %q", v, got, want)
		}
	}
}

type fakeDatasets struct{}

func (fakeDatasets) ID() ID                               { return "fake" }
func (fakeDatasets) RegisterWorkers(*river.Workers)       {}
func (fakeDatasets) Queues() map[string]river.QueueConfig { return nil }
func (fakeDatasets) RegisterRoutes(huma.API)              {}
func (fakeDatasets) Datasets() []Dataset                  { return []Dataset{testDataset} }

func TestDatasetRoutes(t *testing.T) {
	_, api := humatest.New(t)
	// Requests that fail validation never reach the database.
	RegisterDatasetRoutes(api, nil, fakeDatasets{})

	resp := api.Get("/api/fake/preview")
	if resp.Code != 200 {
		t.Fatalf("list: %d %s", resp.Code, resp.Body)
	}
	var infos []DatasetInfo
	if err := json.Unmarshal(resp.Body.Bytes(), &infos); err != nil {
		t.Fatal(err)
	}
	if len(infos) != 1 || infos[0].Name != "things" || len(infos[0].Columns) != len(testDataset.Columns) {
		t.Fatalf("list: %+v", infos)
	}
	if got := infos[0].Columns[0].Filters; !reflect.DeepEqual(got, []string{"id", "id_min", "id_max"}) {
		t.Errorf("id filters: %v", got)
	}

	for _, path := range []string{"/api/fake/preview/things?stat=open", "/api/fake/export/things?format=csv&stat=open"} {
		if resp := api.Get(path); resp.Code != 422 {
			t.Errorf("%s: got %d, want 422", path, resp.Code)
		}
	}
	if resp := api.Get("/api/fake/export/things?format=xml"); resp.Code != 422 {
		t.Errorf("unknown format: got %d, want 422", resp.Code)
	}
	if resp := api.Get("/api/fake/preview/things?limit=5000"); resp.Code != 422 {
		t.Errorf("limit above maximum: got %d, want 422", resp.Code)
	}

	// The filters are documented in the OpenAPI document.
	op := api.OpenAPI().Paths["/api/fake/preview/things"].Get
	names := map[string]bool{}
	for _, p := range op.Parameters {
		names[p.Name] = true
	}
	for _, want := range []string{"since", "until", "state", "created_at_since", "score_min", "limit", "sort"} {
		if !names[want] {
			t.Errorf("parameter %s not documented", want)
		}
	}
}

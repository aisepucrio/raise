package platform

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"raise/internal/apperr"
	"raise/internal/httpapi"
)

// Dashboarder is a platform with an overview dashboard: headline values
// (cards) and time series (graphs) over the data it has mined, optionally
// scoped to one entity (a repository, a Jira project, a Stack Overflow tag).
//
// Platforms only compute the data. RegisterDashboardRoutes serves every
// dashboard at the same paths with the same input and response shapes, so the
// frontend renders all of them with the same code.
type Dashboarder interface {
	Platform
	// Dashboard returns the cards, and the entities when f.Entity is empty.
	// An unknown entity wraps apperr.ErrNotFound; a malformed one
	// apperr.ErrInvalid.
	Dashboard(ctx context.Context, f DashboardFilter) (Dashboard, error)
	// DashboardGraphs returns the graphs, built with BuildGraphs.
	DashboardGraphs(ctx context.Context, f GraphFilter) (DashboardGraphs, error)
}

// DashboardFilter scopes a dashboard. Since is inclusive and Until exclusive;
// nil means unbounded. Each platform documents which timestamp the window
// applies to (e.g. authored_at for commits).
type DashboardFilter struct {
	Entity string
	Since  *time.Time
	Until  *time.Time
}

type GraphFilter struct {
	DashboardFilter
	Interval Interval
}

// EntityID parses an entity that is a numeric ID, such as a repository ID. It
// returns nil when the dashboard isn't scoped.
func (f DashboardFilter) EntityID() (*int64, error) {
	if f.Entity == "" {
		return nil, nil
	}
	id, err := strconv.ParseInt(f.Entity, 10, 64)
	if err != nil || id <= 0 {
		return nil, fmt.Errorf("%w: entity must be a positive integer ID, got %q", apperr.ErrInvalid, f.Entity)
	}
	return &id, nil
}

type DashboardEntity struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Dashboard struct {
	Platform    ID                `json:"platform"`
	Entity      *DashboardEntity  `json:"entity" doc:"The entity the dashboard is scoped to; null for all of the platform's data"`
	Entities    []DashboardEntity `json:"entities" doc:"The entities the dashboard can be scoped to; empty when it is scoped"`
	Cards       []DashboardCard   `json:"cards" doc:"In display order"`
	LastMinedAt *time.Time        `json:"last_mined_at" doc:"When the platform's data in scope was last mined; null if never"`
}

type CardType string

const (
	CardInteger   CardType = "integer"
	CardNumber    CardType = "number"
	CardTimestamp CardType = "timestamp"
	CardText      CardType = "text"
)

// DashboardCard is one typed key/value. Keys are stable identifiers in
// snake_case, like column names; labels are for display.
type DashboardCard struct {
	Key      string   `json:"key" example:"commits"`
	Label    string   `json:"label" example:"Commits"`
	Type     CardType `json:"type" enum:"integer,number,timestamp,text" doc:"How to read value: a JSON integer, a JSON number, an RFC 3339 string or a string"`
	Value    any      `json:"value" doc:"Null when there is no data"`
	Windowed bool     `json:"windowed" doc:"Whether since and until apply. False for snapshots of the current state, such as star counts"`
}

func IntCard(key, label string, v int64) DashboardCard {
	return DashboardCard{Key: key, Label: label, Type: CardInteger, Value: v, Windowed: true}
}

// NullableIntCard is an integer card whose value may be unknown.
func NullableIntCard(key, label string, v *int64) DashboardCard {
	c := IntCard(key, label, 0)
	c.Value = v
	return c
}

func NumberCard(key, label string, v float64) DashboardCard {
	return DashboardCard{Key: key, Label: label, Type: CardNumber, Value: v, Windowed: true}
}

func TimeCard(key, label string, v *time.Time) DashboardCard {
	return DashboardCard{Key: key, Label: label, Type: CardTimestamp, Value: v, Windowed: true}
}

func TextCard(key, label string, v *string) DashboardCard {
	return DashboardCard{Key: key, Label: label, Type: CardText, Value: v, Windowed: true}
}

// Snapshot marks a card that since and until don't apply to.
func (c DashboardCard) Snapshot() DashboardCard {
	c.Windowed = false
	return c
}

type DashboardGraphs struct {
	Platform ID               `json:"platform"`
	Entity   *DashboardEntity `json:"entity" doc:"The entity the graphs are scoped to; null for all of the platform's data"`
	Interval Interval         `json:"interval"`
	Buckets  []string         `json:"buckets" doc:"Start date (UTC) of each interval, shared by every series of every graph. Weeks start on Monday"`
	Graphs   []DashboardGraph `json:"graphs"`
}

type DashboardGraph struct {
	Key        string            `json:"key" example:"activity"`
	Label      string            `json:"label" example:"Activity"`
	Cumulative bool              `json:"cumulative" doc:"Whether each value is the running total up to the end of its interval, including data before since, rather than the value for that interval alone"`
	Series     []DashboardSeries `json:"series"`
}

type DashboardSeries struct {
	Key    string    `json:"key" example:"commits"`
	Label  string    `json:"label" example:"Commits"`
	Values []float64 `json:"values" doc:"One value per bucket"`
}

// Interval is the width of a graph bucket. The values are PostgreSQL
// date_trunc fields, so queries can pass them through:
// date_trunc(interval, t, 'UTC').
type Interval string

const (
	Day   Interval = "day"
	Week  Interval = "week"
	Month Interval = "month"
	Year  Interval = "year"
)

// MaxBuckets bounds the length of a graph. Git histories can contain commits
// dated decades off, so an unbounded daily graph could be huge.
const MaxBuckets = 10000

// Trunc returns the start of the interval containing t, in UTC, as
// PostgreSQL's date_trunc(interval, t, 'UTC') does.
func (i Interval) Trunc(t time.Time) time.Time {
	t = t.UTC()
	y, m, d := t.Date()
	switch i {
	case Week:
		day := time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
		return day.AddDate(0, 0, -((int(day.Weekday()) + 6) % 7))
	case Month:
		return time.Date(y, m, 1, 0, 0, 0, 0, time.UTC)
	case Year:
		return time.Date(y, 1, 1, 0, 0, 0, 0, time.UTC)
	default:
		return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
	}
}

func (i Interval) next(t time.Time) time.Time {
	switch i {
	case Week:
		return t.AddDate(0, 0, 7)
	case Month:
		return t.AddDate(0, 1, 0)
	case Year:
		return t.AddDate(1, 0, 0)
	default:
		return t.AddDate(0, 0, 1)
	}
}

// Point is one interval's value of a series, as a query returns it: Start is
// date_trunc(interval, t, 'UTC').
type Point struct {
	Start time.Time
	Value float64
}

// Points holds the loaded series by key. One series can appear in several
// graphs, e.g. per interval in one and cumulative in another.
type Points map[string][]Point

func (p Points) Add(key string, start time.Time, value float64) {
	p[key] = append(p[key], Point{Start: start, Value: value})
}

type GraphSpec struct {
	Key        string
	Label      string
	Cumulative bool
	Series     []SeriesSpec
}

// SeriesSpec names a series of Points; a key missing from Points is all zeros.
type SeriesSpec struct {
	Key   string
	Label string
}

// BuildGraphs aligns the loaded points on shared buckets and accumulates the
// cumulative graphs.
//
// The buckets run from Since (or the earliest point) to Until (or the latest
// point), without gaps. Points before the first bucket are dropped from
// per-interval graphs and form the starting total of cumulative ones, so a
// platform loads cumulative series without the Since bound. Points after the
// last bucket are dropped.
func BuildGraphs(f GraphFilter, entity *DashboardEntity, points Points, specs ...GraphSpec) (DashboardGraphs, error) {
	out := DashboardGraphs{Entity: entity, Interval: f.Interval, Buckets: []string{}, Graphs: []DashboardGraph{}}

	var first, last time.Time
	for _, ps := range points {
		for _, p := range ps {
			s := f.Interval.Trunc(p.Start)
			if first.IsZero() || s.Before(first) {
				first = s
			}
			if last.IsZero() || s.After(last) {
				last = s
			}
		}
	}
	if f.Since != nil {
		first = f.Interval.Trunc(*f.Since)
	}
	if f.Until != nil {
		// Until is exclusive.
		last = f.Interval.Trunc(f.Until.Add(-time.Nanosecond))
	}

	index := map[time.Time]int{}
	if !first.IsZero() && !last.Before(first) {
		for t := first; !t.After(last); t = f.Interval.next(t) {
			if len(out.Buckets) == MaxBuckets {
				return DashboardGraphs{}, fmt.Errorf("%w: more than %d %s intervals; use a larger interval or narrow since and until",
					apperr.ErrInvalid, MaxBuckets, f.Interval)
			}
			index[t] = len(out.Buckets)
			out.Buckets = append(out.Buckets, t.Format(time.DateOnly))
		}
	}

	for _, g := range specs {
		graph := DashboardGraph{Key: g.Key, Label: g.Label, Cumulative: g.Cumulative, Series: []DashboardSeries{}}
		for _, s := range g.Series {
			values := make([]float64, len(out.Buckets))
			var before float64
			for _, p := range points[s.Key] {
				start := f.Interval.Trunc(p.Start)
				if i, ok := index[start]; ok {
					values[i] += p.Value
				} else if len(out.Buckets) > 0 && start.Before(first) {
					before += p.Value
				}
			}
			if g.Cumulative {
				total := before
				for i := range values {
					total += values[i]
					values[i] = total
				}
			}
			graph.Series = append(graph.Series, DashboardSeries{Key: s.Key, Label: s.Label, Values: values})
		}
		out.Graphs = append(out.Graphs, graph)
	}
	return out, nil
}

type dashboardInput struct {
	Entity string    `query:"entity" doc:"ID of the entity to scope to (for git and github, a repository ID). Empty for all of the platform's data"`
	Since  time.Time `query:"since" doc:"Only data from this time on (RFC 3339, inclusive)"`
	Until  time.Time `query:"until" doc:"Only data before this time (RFC 3339, exclusive)"`
}

// graphInput repeats dashboardInput's fields: huma ignores the fields of an
// unexported embedded struct.
type graphInput struct {
	Entity   string    `query:"entity" doc:"ID of the entity to scope to (for git and github, a repository ID). Empty for all of the platform's data"`
	Since    time.Time `query:"since" doc:"Only data from this time on (RFC 3339, inclusive)"`
	Until    time.Time `query:"until" doc:"Only data before this time (RFC 3339, exclusive)"`
	Interval Interval  `query:"interval" enum:"day,week,month,year" default:"month"`
}

func (in graphInput) dashboardInput() dashboardInput {
	return dashboardInput{Entity: in.Entity, Since: in.Since, Until: in.Until}
}

func (in dashboardInput) filter() (DashboardFilter, error) {
	f := DashboardFilter{Entity: in.Entity}
	if !in.Since.IsZero() {
		f.Since = &in.Since
	}
	if !in.Until.IsZero() {
		f.Until = &in.Until
	}
	if f.Since != nil && f.Until != nil && !f.Since.Before(*f.Until) {
		return f, fmt.Errorf("%w: since must be before until", apperr.ErrInvalid)
	}
	return f, nil
}

// RegisterDashboardRoutes serves d's dashboard at /api/{platform}/dashboard
// and its graphs at /api/{platform}/dashboard/graph.
func RegisterDashboardRoutes(api huma.API, d Dashboarder) {
	id := d.ID()
	tags := []string{"dashboards"}

	huma.Register(api, huma.Operation{
		OperationID: string(id) + "-dashboard", Method: http.MethodGet, Path: "/api/" + string(id) + "/dashboard",
		Summary: "Get the " + string(id) + " dashboard cards", Tags: tags,
	}, func(ctx context.Context, in *dashboardInput) (*struct{ Body Dashboard }, error) {
		f, err := in.filter()
		if err != nil {
			return nil, httpapi.Error(err)
		}
		out, err := d.Dashboard(ctx, f)
		if err != nil {
			return nil, httpapi.Error(err)
		}
		out.Platform = id
		if out.Entities == nil {
			out.Entities = []DashboardEntity{}
		}
		if out.Cards == nil {
			out.Cards = []DashboardCard{}
		}
		return &struct{ Body Dashboard }{out}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: string(id) + "-dashboard-graph", Method: http.MethodGet, Path: "/api/" + string(id) + "/dashboard/graph",
		Summary: "Get the " + string(id) + " dashboard graphs", Tags: tags,
	}, func(ctx context.Context, in *graphInput) (*struct{ Body DashboardGraphs }, error) {
		f, err := in.dashboardInput().filter()
		if err != nil {
			return nil, httpapi.Error(err)
		}
		out, err := d.DashboardGraphs(ctx, GraphFilter{DashboardFilter: f, Interval: in.Interval})
		if err != nil {
			return nil, httpapi.Error(err)
		}
		out.Platform = id
		return &struct{ Body DashboardGraphs }{out}, nil
	})
}

// NullTime converts a nullable timestamp aggregate, such as max(t), which sqlc
// can't type and generates as interface{}, to a pointer.
func NullTime(v any) *time.Time {
	if t, ok := v.(time.Time); ok {
		return &t
	}
	return nil
}

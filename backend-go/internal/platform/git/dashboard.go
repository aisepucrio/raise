package git

import (
	"context"
	"fmt"
	"strconv"

	"raise/internal/apperr"
	"raise/internal/platform"
	"raise/internal/platform/git/sqlc"
)

var _ platform.Dashboarder = (*Platform)(nil)

// The git dashboard's entities are repositories, and its window applies to
// commits' authored_at. Authors are distinct lower-cased author emails.

func (p *Platform) Dashboard(ctx context.Context, f platform.DashboardFilter) (platform.Dashboard, error) {
	repoID, entity, entities, err := p.dashboardScope(ctx, f)
	if err != nil {
		return platform.Dashboard{}, err
	}
	repos, err := p.q.DashboardRepositories(ctx, repoID)
	if err != nil {
		return platform.Dashboard{}, err
	}
	commits, err := p.q.DashboardCommits(ctx, sqlc.DashboardCommitsParams{RepositoryID: repoID, Since: f.Since, Until: f.Until})
	if err != nil {
		return platform.Dashboard{}, err
	}
	refs, err := p.q.DashboardRefs(ctx, repoID)
	if err != nil {
		return platform.Dashboard{}, err
	}

	var cards []platform.DashboardCard
	if repoID == nil {
		cards = append(cards, platform.IntCard("repositories", "Repositories", repos.RepositoryCount).Snapshot())
	}
	cards = append(cards,
		platform.IntCard("commits", "Commits", commits.CommitCount),
		platform.IntCard("authors", "Authors", commits.AuthorCount),
		platform.IntCard("lines_added", "Lines added", commits.LinesAdded),
		platform.IntCard("lines_deleted", "Lines deleted", commits.LinesDeleted),
		platform.TimeCard("first_authored_at", "First commit", platform.NullTime(commits.FirstAuthoredAt)),
		platform.TimeCard("last_authored_at", "Last commit", platform.NullTime(commits.LastAuthoredAt)),
		platform.IntCard("branches", "Branches", refs.BranchCount).Snapshot(),
		platform.IntCard("tags", "Tags", refs.TagCount).Snapshot(),
	)
	return platform.Dashboard{
		Entity:      entity,
		Entities:    entities,
		Cards:       cards,
		LastMinedAt: platform.NullTime(repos.MirrorLastSyncedAt),
	}, nil
}

func (p *Platform) DashboardGraphs(ctx context.Context, f platform.GraphFilter) (platform.DashboardGraphs, error) {
	repoID, entity, _, err := p.dashboardScope(ctx, f.DashboardFilter)
	if err != nil {
		return platform.DashboardGraphs{}, err
	}
	rows, err := p.q.DashboardCommitActivity(ctx, sqlc.DashboardCommitActivityParams{
		Interval: string(f.Interval), RepositoryID: repoID, Until: f.Until,
	})
	if err != nil {
		return platform.DashboardGraphs{}, err
	}
	points := platform.Points{}
	for _, r := range rows {
		points.Add("commits", r.Bucket, float64(r.CommitCount))
		points.Add("authors", r.Bucket, float64(r.AuthorCount))
		points.Add("lines_added", r.Bucket, float64(r.LinesAdded))
		points.Add("lines_deleted", r.Bucket, float64(r.LinesDeleted))
	}
	return platform.BuildGraphs(f, entity, points,
		platform.GraphSpec{Key: "activity", Label: "Activity", Series: []platform.SeriesSpec{
			{Key: "commits", Label: "Commits"},
			{Key: "authors", Label: "Active authors"},
		}},
		platform.GraphSpec{Key: "growth", Label: "Total commits", Cumulative: true, Series: []platform.SeriesSpec{
			{Key: "commits", Label: "Commits"},
		}},
		platform.GraphSpec{Key: "churn", Label: "Code churn", Series: []platform.SeriesSpec{
			{Key: "lines_added", Label: "Lines added"},
			{Key: "lines_deleted", Label: "Lines deleted"},
		}},
	)
}

func (p *Platform) DashboardDateRange(ctx context.Context, f platform.DashboardFilter) (platform.DashboardDateRange, error) {
	repoID, entity, _, err := p.dashboardScope(ctx, f)
	if err != nil {
		return platform.DashboardDateRange{}, err
	}
	r, err := p.q.DashboardDateRange(ctx, repoID)
	if err != nil {
		return platform.DashboardDateRange{}, err
	}
	return platform.DashboardDateRange{Entity: entity, FirstAt: platform.NullTime(r.FirstAt), LastAt: platform.NullTime(r.LastAt)}, nil
}

// dashboardScope resolves the filter's repository. Unscoped, it lists every
// repository as an entity instead.
func (p *Platform) dashboardScope(ctx context.Context, f platform.DashboardFilter) (*int64, *platform.DashboardEntity, []platform.DashboardEntity, error) {
	repoID, err := f.EntityID()
	if err != nil {
		return nil, nil, nil, err
	}
	rows, err := p.q.ListDashboardEntities(ctx, repoID)
	if err != nil {
		return nil, nil, nil, err
	}
	entities := make([]platform.DashboardEntity, len(rows))
	for i, r := range rows {
		entities[i] = platform.DashboardEntity{ID: strconv.FormatInt(r.ID, 10), Name: r.Host + "/" + r.Path}
	}
	if repoID == nil {
		return nil, nil, entities, nil
	}
	if len(entities) == 0 {
		return nil, nil, nil, fmt.Errorf("%w: repository %d", apperr.ErrNotFound, *repoID)
	}
	return repoID, &entities[0], nil, nil
}

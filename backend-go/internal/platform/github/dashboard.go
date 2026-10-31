package github

import (
	"context"
	"fmt"
	"strconv"

	"raise/internal/apperr"
	"raise/internal/platform"
	"raise/internal/platform/github/sqlc"
)

var _ platform.Dashboarder = (*Platform)(nil)

// The GitHub dashboard's entities are the repositories hosted on GitHub. Its
// window applies to github_created_at, and to authored_at for contributors.
// Open counts are items created in the window that are open now.

func (p *Platform) Dashboard(ctx context.Context, f platform.DashboardFilter) (platform.Dashboard, error) {
	repoID, entity, entities, err := p.dashboardScope(ctx, f)
	if err != nil {
		return platform.Dashboard{}, err
	}
	repos, err := p.q.DashboardRepositories(ctx, repoID)
	if err != nil {
		return platform.Dashboard{}, err
	}
	counts, err := p.q.DashboardCounts(ctx, sqlc.DashboardCountsParams{RepositoryID: repoID, Since: f.Since, Until: f.Until})
	if err != nil {
		return platform.Dashboard{}, err
	}
	lastMined, err := p.q.DashboardLastMinedAt(ctx, repoID)
	if err != nil {
		return platform.Dashboard{}, err
	}

	// Stars, forks and watchers come from the metadata, summed when
	// unscoped, and are unknown until it is mined.
	var stars, forks, watchers *int64
	if repos.RepositoryCount > 0 {
		stars, forks, watchers = &repos.StarCount, &repos.ForkCount, &repos.WatcherCount
	}

	var cards []platform.DashboardCard
	if repoID == nil {
		cards = append(cards, platform.IntCard("repositories", "Repositories", int64(len(entities))).Snapshot())
	}
	cards = append(cards,
		platform.IntCard("issues", "Issues", counts.IssueCount),
		platform.IntCard("open_issues", "Open issues", counts.OpenIssueCount),
		platform.IntCard("pull_requests", "Pull requests", counts.PullRequestCount),
		platform.IntCard("open_pull_requests", "Open pull requests", counts.OpenPullRequestCount),
		platform.IntCard("merged_pull_requests", "Merged pull requests", counts.MergedPullRequestCount),
		platform.IntCard("releases", "Releases", counts.ReleaseCount),
		platform.IntCard("contributors", "Contributors", counts.ContributorCount),
		platform.NullableIntCard("stars", "Stars", stars).Snapshot(),
		platform.NullableIntCard("forks", "Forks", forks).Snapshot(),
		platform.NullableIntCard("watchers", "Watchers", watchers).Snapshot(),
	)
	return platform.Dashboard{
		Entity:      entity,
		Entities:    entities,
		Cards:       cards,
		LastMinedAt: platform.NullTime(lastMined),
	}, nil
}

func (p *Platform) DashboardGraphs(ctx context.Context, f platform.GraphFilter) (platform.DashboardGraphs, error) {
	repoID, entity, _, err := p.dashboardScope(ctx, f.DashboardFilter)
	if err != nil {
		return platform.DashboardGraphs{}, err
	}
	rows, err := p.q.DashboardActivity(ctx, sqlc.DashboardActivityParams{
		Interval: string(f.Interval), RepositoryID: repoID, Until: f.Until,
	})
	if err != nil {
		return platform.DashboardGraphs{}, err
	}
	points := platform.Points{}
	for _, r := range rows {
		points.Add(r.Series, r.Bucket, float64(r.Value))
	}
	return platform.BuildGraphs(f, entity, points,
		platform.GraphSpec{Key: "activity", Label: "Activity", Series: []platform.SeriesSpec{
			{Key: "issues_opened", Label: "Issues opened"},
			{Key: "issues_closed", Label: "Issues closed"},
			{Key: "pull_requests_opened", Label: "Pull requests opened"},
			{Key: "pull_requests_merged", Label: "Pull requests merged"},
			{Key: "releases", Label: "Releases"},
		}},
		platform.GraphSpec{Key: "growth", Label: "Totals", Cumulative: true, Series: []platform.SeriesSpec{
			{Key: "issues_opened", Label: "Issues"},
			{Key: "pull_requests_opened", Label: "Pull requests"},
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

// dashboardScope resolves the filter's repository, which must be hosted on
// GitHub. Unscoped, it lists those repositories as entities instead.
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
		entities[i] = platform.DashboardEntity{ID: strconv.FormatInt(r.RepositoryID, 10), Name: r.Owner + "/" + r.Name}
	}
	if repoID == nil {
		return nil, nil, entities, nil
	}
	if len(entities) == 0 {
		return nil, nil, nil, fmt.Errorf("%w: repository %d on GitHub", apperr.ErrNotFound, *repoID)
	}
	return repoID, &entities[0], nil, nil
}

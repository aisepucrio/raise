import { useMemo, useState } from "react";

import {
  OverviewChartSection,
  OverviewFilters,
  OverviewLayout,
  OverviewStatsSection,
} from "@/components/overview";
import {
  getQueryErrorMessage,
  mergeDateRanges,
  toApiSince,
  toApiUntil,
  useDashboardDateRangeQuery,
  useDashboardGraphQuery,
  useDashboardQuery,
  type DashboardFilter,
} from "@/data";
import {
  buildDashboardCardItems,
  buildLineSeriesFromDashboardGraphs,
  resolveOverviewGraphInterval,
  type DashboardCardPick,
} from "@/sources/shared/OverviewShared";
import { buildSelectOptions } from "@/sources/shared/AllShared";

// The GitHub overview combines two Go dashboards scoped to the same
// repository ID: `github` (issues, pull requests, releases, stars, ...) and
// `git` (commits, mined locally). Cards are picked by key; labels come from
// the API.
export default function GithubOverview() {
  // Filters controlled by this screen only (not stored in the URL).
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Unscoped GitHub dashboard: its entities are the GitHub-hosted repositories.
  const repositoryCatalogQuery = useDashboardQuery("github");
  const repositoryOptions = useMemo(
    () => buildSelectOptions(repositoryCatalogQuery.data?.entities),
    [repositoryCatalogQuery.data?.entities],
  );

  const filter = useMemo<DashboardFilter>(
    () => ({
      ...(selectedRepositoryId ? { entity: selectedRepositoryId } : {}),
      ...(startDate ? { since: toApiSince(startDate) } : {}),
      ...(endDate ? { until: toApiUntil(endDate) } : {}),
    }),
    [selectedRepositoryId, startDate, endDate],
  );
  const githubQuery = useDashboardQuery("github", filter);
  const gitQuery = useDashboardQuery("git", filter);

  // Date pickers are bounded by the data of both platforms.
  const githubRangeQuery = useDashboardDateRangeQuery(
    "github",
    selectedRepositoryId || undefined,
  );
  const gitRangeQuery = useDashboardDateRangeQuery(
    "git",
    selectedRepositoryId || undefined,
  );
  const dateBounds = useMemo(
    () => mergeDateRanges([githubRangeQuery.data, gitRangeQuery.data]),
    [githubRangeQuery.data, gitRangeQuery.data],
  );

  const graphFilter = useMemo(
    () => ({
      ...filter,
      interval: resolveOverviewGraphInterval(startDate, endDate, dateBounds),
    }),
    [filter, startDate, endDate, dateBounds],
  );
  const githubGraphQuery = useDashboardGraphQuery("github", graphFilter);
  const gitGraphQuery = useDashboardGraphQuery("git", graphFilter);

  const graphSeries = useMemo(
    () =>
      buildLineSeriesFromDashboardGraphs([
        { graphs: gitGraphQuery.data, key: "activity", series: ["commits"] },
        { graphs: githubGraphQuery.data, key: "activity" },
      ]),
    [gitGraphQuery.data, githubGraphQuery.data],
  );
  const graphError = githubGraphQuery.error ?? gitGraphQuery.error;

  const isRepositoryScoped = Boolean(selectedRepositoryId);
  const github = githubQuery.data;
  const git = gitQuery.data;
  const cardPicks: DashboardCardPick[] = isRepositoryScoped
    ? [
        { dashboard: git, key: "commits" },
        { dashboard: github, key: "issues" },
        { dashboard: github, key: "pull_requests" },
        { dashboard: github, key: "contributors" },
        { dashboard: github, key: "forks" },
        { dashboard: github, key: "stars" },
      ]
    : [
        { dashboard: github, key: "repositories" },
        { dashboard: github, key: "issues" },
        { dashboard: github, key: "pull_requests" },
        { dashboard: git, key: "commits" },
        { dashboard: github, key: "contributors" },
      ];
  const infoBoxItems = buildDashboardCardItems(
    cardPicks,
    githubQuery.isPending || gitQuery.isPending,
  );

  return (
    <OverviewLayout
      filters={
        <OverviewFilters
          idPrefix="github-overview"
          sourceFilterLabel="Repository"
          allSourcesOptionLabel="All repositories"
          sourceOptions={repositoryOptions}
          selectedSourceId={selectedRepositoryId}
          onSourceChange={setSelectedRepositoryId}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          isSourceListPending={repositoryCatalogQuery.isPending}
          dateRange={dateBounds}
        />
      }
      chart={
        <OverviewChartSection
          title="GitHub Activity"
          data={graphSeries}
          loading={githubGraphQuery.isPending || gitGraphQuery.isPending}
          error={
            graphError
              ? getQueryErrorMessage(graphError, "Failed to load the GitHub chart.")
              : null
          }
          emptyMessage="No series found for the selected filters."
        />
      }
      stats={<OverviewStatsSection items={infoBoxItems} />}
    />
  );
}

import { useMemo, useState } from "react";

import {
  OverviewChartSection,
  OverviewFilters,
  OverviewLayout,
  OverviewStatsSection,
} from "@/components/overview";
import {
  useGithubDateRangeByRepositoryQuery,
  useGithubGraphQuery,
  useGithubOverviewQuery,
  type GithubGraphParams,
  type GithubOverviewParams,
  type GithubOverviewResponse,
} from "@/data";
import {
  buildOverviewEndpointParams,
  buildOverviewGraphEndpointParams,
  buildScopedOverviewMetricCardItems,
  resolveOverviewGraphPresentation,
  resolveOverviewGraphInterval,
  type OverviewMetricCardConfig,
} from "@/sources/shared/OverviewShared";
import { buildSelectOptions } from "@/sources/shared/AllShared";

// Cards shown when in repository is selected.
// Order here matches sidebar visual order in "All repositories" mode.
const ALL_REPOSITORIES_CARD_CONFIG: readonly OverviewMetricCardConfig<GithubOverviewResponse>[] =
  [
    { title: "Repositories", getValue: (data) => data?.repositories_count },
    { title: "Issues", getValue: (data) => data?.issues_count },
    { title: "Pull Requests", getValue: (data) => data?.pull_requests_count },
    { title: "Commits", getValue: (data) => data?.commits_count },
    { title: "Users", getValue: (data) => data?.users_count },
  ];

// Cards shown for the specific repository.
const REPOSITORY_CARD_CONFIG: readonly OverviewMetricCardConfig<GithubOverviewResponse>[] =
  [
    { title: "Commits", getValue: (data) => data?.commits_count },
    { title: "Issues", getValue: (data) => data?.issues_count },
    { title: "Pull Requests", getValue: (data) => data?.pull_requests_count },
    { title: "Users", getValue: (data) => data?.users_count },
    { title: "Forks", getValue: (data) => data?.forks_count },
    { title: "Stars", getValue: (data) => data?.stars_count },
  ];

export default function GithubOverview() {
  // Filters controlled by this screen only (not stored in the URL).
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Catalog used only to build the repository selector.
  const repositoryCatalogQuery = useGithubOverviewQuery();

  // Adapts API payload to the standard UI option format.
  const repositoryOptions = useMemo(
    () =>
      buildSelectOptions(repositoryCatalogQuery.data?.repositories, {
        getValue: (repository) => repository.id,
        getLabel: (repository) => repository.repository,
      }),
    [repositoryCatalogQuery.data?.repositories],
  );

  // Query parameters for overview cards.
  const overviewParams = useMemo(
    () =>
      buildOverviewEndpointParams<GithubOverviewParams>(
        {
          selectedSourceId: selectedRepositoryId,
          startDate,
          endDate,
        },
        "repository_id",
      ),
    [selectedRepositoryId, startDate, endDate],
  );
  const overviewQuery = useGithubOverviewQuery(overviewParams);

  // Time series uses the same filters plus range-derived interval.
  const graphParams = useMemo(
    () =>
      buildOverviewGraphEndpointParams<GithubGraphParams>(
        {
          selectedSourceId: selectedRepositoryId,
          startDate,
          endDate,
          interval: resolveOverviewGraphInterval(startDate, endDate),
        },
        "repository_id",
      ),
    [selectedRepositoryId, startDate, endDate],
  );
  const graphQuery = useGithubGraphQuery(graphParams);

  // The hook itself already:
  // - normalizes string empty for `undefined`
  // - only enables the query when there is `repository_id`
  const dateRangeQuery = useGithubDateRangeByRepositoryQuery(
    selectedRepositoryId,
  );

  const { graphSeries, graphErrorMessage } = resolveOverviewGraphPresentation(
    graphQuery,
    "Failed to load the GitHub chart.",
  );

  // Scoped mode: a specific repository is selected.
  const isRepositoryScoped = Boolean(selectedRepositoryId);
  const infoBoxItems = buildScopedOverviewMetricCardItems({
    overviewData: overviewQuery.data,
    isOverviewPending: overviewQuery.isPending,
    isSourceScoped: isRepositoryScoped,
    allScopeConfig: ALL_REPOSITORIES_CARD_CONFIG,
    sourceScopeConfig: REPOSITORY_CARD_CONFIG,
  });

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
          dateRange={dateRangeQuery.data}
        />
      }
      chart={
        <OverviewChartSection
          title="GitHub Activity"
          data={graphSeries}
          loading={graphQuery.isPending}
          error={graphErrorMessage}
          emptyMessage="No series found for the selected filters."
        />
      }
      stats={<OverviewStatsSection items={infoBoxItems} />}
    />
  );
}

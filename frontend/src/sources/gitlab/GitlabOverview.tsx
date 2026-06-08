import { useMemo, useState } from "react";

import {
  OverviewChartSection,
  OverviewFilters,
  OverviewLayout,
  OverviewStatsSection,
} from "@/components/overview";
import {
  useGitlabDateRangeByRepositoryQuery,
  useGitlabGraphQuery,
  useGitlabOverviewQuery,
  type GitlabGraphParams,
  type GitlabOverviewParams,
  type GitlabOverviewResponse,
} from "@/data";
import { buildSelectOptions } from "@/sources/shared/AllShared";
import {
  buildOverviewEndpointParams,
  buildScopedOverviewMetricCardItems,
  resolveOverviewGraphPresentation,
  type OverviewMetricCardConfig,
} from "@/sources/shared/OverviewShared";

const ALL_REPOSITORIES_CARD_CONFIG: readonly OverviewMetricCardConfig<GitlabOverviewResponse>[] =
  [
    { title: "Projects", getValue: (data) => data?.repositories_count },
    { title: "Issues", getValue: (data) => data?.issues_count },
    { title: "Merge Requests", getValue: (data) => data?.pull_requests_count },
    { title: "Commits", getValue: (data) => data?.commits_count },
    { title: "Users", getValue: (data) => data?.users_count },
  ];

const REPOSITORY_CARD_CONFIG: readonly OverviewMetricCardConfig<GitlabOverviewResponse>[] =
  [
    { title: "Commits", getValue: (data) => data?.commits_count },
    { title: "Issues", getValue: (data) => data?.issues_count },
    { title: "Merge Requests", getValue: (data) => data?.pull_requests_count },
    { title: "Users", getValue: (data) => data?.users_count },
    { title: "Forks", getValue: (data) => data?.forks_count },
    { title: "Stars", getValue: (data) => data?.stars_count },
    { title: "Watchers", getValue: (data) => data?.watchers_count },
  ];

function resolveGitlabGraphInterval(startDate: string, endDate: string) {
  if (!startDate || !endDate) return "month" as const;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();

  if (!Number.isFinite(diffMs) || diffMs <= 0) return "day" as const;

  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays > 180) return "month" as const;
  if (diffDays > 45) return "week" as const;
  return "day" as const;
}

export default function GitlabOverview() {
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const repositoryCatalogQuery = useGitlabOverviewQuery();

  const repositoryOptions = useMemo(
    () =>
      buildSelectOptions(repositoryCatalogQuery.data?.repositories, {
        getValue: (repository) => repository.id,
        getLabel: (repository) => repository.repository,
      }),
    [repositoryCatalogQuery.data?.repositories],
  );

  const overviewParams = useMemo(
    () =>
      buildOverviewEndpointParams<GitlabOverviewParams>(
        {
          selectedSourceId: selectedRepositoryId,
          startDate,
          endDate,
        },
        "repository_id",
      ),
    [selectedRepositoryId, startDate, endDate],
  );
  const overviewQuery = useGitlabOverviewQuery(overviewParams);

  const graphParams = useMemo(
    (): GitlabGraphParams => ({
      interval: resolveGitlabGraphInterval(startDate, endDate),
      ...(selectedRepositoryId ? { repository_id: selectedRepositoryId } : {}),
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    }),
    [selectedRepositoryId, startDate, endDate],
  );
  const graphQuery = useGitlabGraphQuery(graphParams);

  const dateRangeQuery = useGitlabDateRangeByRepositoryQuery(
    selectedRepositoryId,
  );

  const { graphSeries, graphErrorMessage } = resolveOverviewGraphPresentation(
    graphQuery,
    "Failed to load the GitLab chart.",
  );

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
          idPrefix="gitlab-overview"
          sourceFilterLabel="Project"
          allSourcesOptionLabel="All projects"
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
          title="GitLab Activity"
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

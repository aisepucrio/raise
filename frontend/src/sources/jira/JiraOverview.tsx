import { useMemo, useState } from "react";

import {
  OverviewChartSection,
  OverviewFilters,
  OverviewLayout,
  OverviewStatsSection,
} from "@/components/overview";
import {
  useJiraDateRangeByProjectQuery,
  useJiraGraphQuery,
  useJiraOverviewQuery,
  type DashboardOverviewResponse,
  type JiraOverviewParams,
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

// Cards shown when in project is selected.
// Order here matches sidebar visual order in "All projects" mode.
const ALL_PROJECTS_CARD_CONFIG: readonly OverviewMetricCardConfig<DashboardOverviewResponse>[] =
  [
    { title: "Issues", getValue: (data) => data?.cards?.issues },
    { title: "Projects", getValue: (data) => data?.cards?.projects },
    { title: "Users", getValue: (data) => data?.cards?.users },
  ];

// Cards shown for the specific project.
const PROJECT_CARD_CONFIG: readonly OverviewMetricCardConfig<DashboardOverviewResponse>[] =
  [
    { title: "Issues", getValue: (data) => data?.cards?.issues },
    { title: "Comments", getValue: (data) => data?.cards?.comments },
    { title: "Sprints", getValue: (data) => data?.cards?.sprints },
    { title: "Users", getValue: (data) => data?.cards?.users },
  ];

export default function JiraOverview() {
  // Filters controlled by this screen only (not stored in the URL).
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Catalog used only to build the project selector.
  const projectCatalogQuery = useJiraOverviewQuery();

  // Adapts API payload to the standard UI option format.
  const projectOptions = useMemo(
    () => buildSelectOptions(projectCatalogQuery.data?.entities),
    [projectCatalogQuery.data?.entities],
  );

  // Query parameters for overview cards.
  const overviewParams = useMemo(
    () =>
      buildOverviewEndpointParams<JiraOverviewParams>(
        {
          selectedSourceId: selectedProjectId,
          startDate,
          endDate,
        },
        "project_id",
      ),
    [selectedProjectId, startDate, endDate],
  );
  const overviewQuery = useJiraOverviewQuery(overviewParams);

  // Time series uses the same filters plus range-derived interval.
  const graphParams = useMemo(
    () =>
      buildOverviewGraphEndpointParams(
        {
          selectedSourceId: selectedProjectId,
          startDate,
          endDate,
          interval: resolveOverviewGraphInterval(startDate, endDate),
        },
        "project_id",
      ),
    [selectedProjectId, startDate, endDate],
  );
  const graphQuery = useJiraGraphQuery(graphParams);

  // The hook itself already:
  // - normalizes string empty for `undefined`
  // - only enables the query when there is `project_id`
  const dateRangeQuery = useJiraDateRangeByProjectQuery(selectedProjectId);

  const { graphSeries, graphErrorMessage } = resolveOverviewGraphPresentation(
    graphQuery,
    "Failed to load the Jira chart.",
  );

  // Scoped mode: a specific project is selected.
  const isProjectScoped = Boolean(selectedProjectId);
  const infoBoxItems = buildScopedOverviewMetricCardItems({
    overviewData: overviewQuery.data,
    isOverviewPending: overviewQuery.isPending,
    isSourceScoped: isProjectScoped,
    allScopeConfig: ALL_PROJECTS_CARD_CONFIG,
    sourceScopeConfig: PROJECT_CARD_CONFIG,
  });

  return (
    <OverviewLayout
      filters={
        <OverviewFilters
          idPrefix="jira-overview"
          sourceFilterLabel="Project"
          allSourcesOptionLabel="All projects"
          sourceOptions={projectOptions}
          selectedSourceId={selectedProjectId}
          onSourceChange={setSelectedProjectId}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          isSourceListPending={projectCatalogQuery.isPending}
          dateRange={dateRangeQuery.data}
        />
      }
      chart={
        <OverviewChartSection
          title="Jira Activity"
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

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
  type JiraGraphParams,
  type JiraOverviewParams,
  type JiraOverviewResponse,
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
const ALL_PROJECTS_CARD_CONFIG: readonly OverviewMetricCardConfig<JiraOverviewResponse>[] =
  [
    { title: "Issues", getValue: (data) => data?.issues_count },
    { title: "Projects", getValue: (data) => data?.projects_count },
    { title: "Users", getValue: (data) => data?.users_count },
  ];

// Cards shown for the specific project.
const PROJECT_CARD_CONFIG: readonly OverviewMetricCardConfig<JiraOverviewResponse>[] =
  [
    { title: "Issues", getValue: (data) => data?.issues_count },
    { title: "Comments", getValue: (data) => data?.comments_count },
    { title: "Sprints", getValue: (data) => data?.sprints_count },
    { title: "Users", getValue: (data) => data?.users_count },
  ];

export default function JiraOverview() {
  // filters controlled pela own screen (not stay in the URL).
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // catalog used only for build the select of projects.
  const projectCatalogQuery = useJiraOverviewQuery();

  // adapts payload of the API for the format standard of options of the UI.
  const projectOptions = useMemo(
    () =>
      buildSelectOptions(projectCatalogQuery.data?.projects, {
        getValue: (project) => project.name,
        getLabel: (project) => project.name,
      }),
    [projectCatalogQuery.data?.projects],
  );

  // Params of the query of overview (cards).
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

  // series temporal usa the same filters + interval derived of the range.
  const graphParams = useMemo(
    () =>
      buildOverviewGraphEndpointParams<JiraGraphParams>(
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

  // the own hook already:
  // - normalizes string empty for `undefined`
  // - only enables the query when there is `project_id`
  const dateRangeQuery = useJiraDateRangeByProjectQuery(selectedProjectId);

  const { graphSeries, graphErrorMessage } = resolveOverviewGraphPresentation(
    graphQuery,
    "Failed to load the Jira chart.",
  );

  // mode scoped = the project specific selected.
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

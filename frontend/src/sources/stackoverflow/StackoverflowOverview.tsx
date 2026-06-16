import { useMemo, useState } from "react";

import {
  OverviewChartSection,
  OverviewFilters,
  OverviewLayout,
  OverviewStatsSection,
} from "@/components/overview";
import {
  useStackOverflowDateRangeByTagQuery,
  useStackOverflowGraphQuery,
  useStackOverflowOverviewQuery,
  type DashboardOverviewResponse,
  type StackOverflowOverviewParams,
} from "@/data";
import { buildSelectOptions } from "@/sources/shared/AllShared";
import {
  buildOverviewEndpointParams,
  buildOverviewGraphEndpointParams,
  buildScopedOverviewMetricCardItems,
  resolveOverviewGraphInterval,
  resolveOverviewGraphPresentation,
  type OverviewMetricCardConfig,
} from "@/sources/shared/OverviewShared";

const ALL_TAGS_CARD_CONFIG: readonly OverviewMetricCardConfig<DashboardOverviewResponse>[] =
  [
    { title: "Tags", getValue: (data) => data?.cards?.tags },
    { title: "Questions", getValue: (data) => data?.cards?.questions },
    { title: "Answers", getValue: (data) => data?.cards?.answers },
    { title: "Comments", getValue: (data) => data?.cards?.comments },
    { title: "Users", getValue: (data) => data?.cards?.users },
  ];

const TAG_CARD_CONFIG: readonly OverviewMetricCardConfig<DashboardOverviewResponse>[] =
  [
    { title: "Questions", getValue: (data) => data?.cards?.questions },
    { title: "Answers", getValue: (data) => data?.cards?.answers },
    { title: "Comments", getValue: (data) => data?.cards?.comments },
    { title: "Users", getValue: (data) => data?.cards?.users },
  ];

export default function StackoverflowOverview() {
  const [selectedTag, setSelectedTag] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const tagCatalogQuery = useStackOverflowOverviewQuery();

  const tagOptions = useMemo(
    () => buildSelectOptions(tagCatalogQuery.data?.entities),
    [tagCatalogQuery.data?.entities],
  );

  const overviewParams = useMemo(
    () =>
      buildOverviewEndpointParams<StackOverflowOverviewParams>(
        {
          selectedSourceId: selectedTag,
          startDate,
          endDate,
        },
        "tag",
      ),
    [selectedTag, startDate, endDate],
  );

  const dateRangeQuery = useStackOverflowDateRangeByTagQuery(selectedTag);

  const graphParams = useMemo(
    () =>
      buildOverviewGraphEndpointParams(
        {
          selectedSourceId: selectedTag,
          startDate,
          endDate,
          interval: resolveOverviewGraphInterval(
            startDate,
            endDate,
            dateRangeQuery.data,
          ),
        },
        "tag",
      ),
    [selectedTag, startDate, endDate, dateRangeQuery.data],
  );

  const overviewQuery = useStackOverflowOverviewQuery(overviewParams);
  const graphQuery = useStackOverflowGraphQuery(graphParams);

  const { graphSeries, graphErrorMessage } = resolveOverviewGraphPresentation(
    graphQuery,
    "Failed to load the Stack Overflow chart.",
  );

  const isTagSelected = Boolean(selectedTag);
  const infoBoxItems = buildScopedOverviewMetricCardItems({
    overviewData: overviewQuery.data,
    isOverviewPending: overviewQuery.isPending,
    isSourceScoped: isTagSelected,
    allScopeConfig: ALL_TAGS_CARD_CONFIG,
    sourceScopeConfig: TAG_CARD_CONFIG,
  });

  return (
    <OverviewLayout
      filters={
        <OverviewFilters
          idPrefix="stackoverflow-overview"
          sourceFilterLabel="Tag"
          allSourcesOptionLabel="All tags"
          sourceOptions={tagOptions}
          selectedSourceId={selectedTag}
          onSourceChange={setSelectedTag}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          isSourceListPending={tagCatalogQuery.isPending}
          dateRange={dateRangeQuery.data}
        />
      }
      chart={
        <OverviewChartSection
          title="Stack Overflow Activity"
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

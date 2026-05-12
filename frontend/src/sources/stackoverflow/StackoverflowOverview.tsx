import { useMemo, useState } from "react";

import {
  OverviewChartSection,
  OverviewFilters,
  OverviewLayout,
  OverviewStatsSection,
} from "@/components/overview";

import {
  useStackOverflowOverviewQuery,
  useStackOverflowGraphQuery,
  useStackOverflowDateRangeByQuestionQuery,
  type StackOverflowGraphParams,
  type StackOverflowOverviewParams,
  type StackOverflowOverviewResponse,
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



const ALL_CARD_CONFIG: readonly OverviewMetricCardConfig<StackOverflowOverviewResponse>[] =
  [
    { title: "Questions", getValue: (data) => data?.questions_count },
    { title: "Answers", getValue: (data) => data?.answers_count },
    { title: "Comments", getValue: (data) => data?.comments_count },
    { title: "Tags", getValue: (data) => data?.tags_count },
  ];

const SCOPED_CARD_CONFIG: readonly OverviewMetricCardConfig<StackOverflowOverviewResponse>[] =
  [
    { title: "Questions", getValue: (data) => data?.questions_count },
    { title: "Answers", getValue: (data) => data?.answers_count },
    { title: "Comments", getValue: (data) => data?.comments_count },
    { title: "Tags", getValue: (data) => data?.tags_count },
  ];

export default function StackoverflowOverview() {
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  
  const catalogQuery = useStackOverflowOverviewQuery();

  const questionOptions = useMemo(
    () =>
      buildSelectOptions(catalogQuery.data?.questions, {
        getValue: (q) => String(q.id ?? q.question_id ?? ""),
        getLabel: (q) =>
          q.title ?? q.question_title ?? q.display ?? "Unknown",
      }),
    [catalogQuery.data?.questions],
  );

  
  const overviewParams = useMemo(
    () =>
      buildOverviewEndpointParams<StackOverflowOverviewParams>(
        {
          selectedSourceId: selectedQuestionId,
          startDate,
          endDate,
        },
        "question_id",
      ),
    [selectedQuestionId, startDate, endDate],
  );

  const overviewQuery = useStackOverflowOverviewQuery(overviewParams);

 
const graphParams = useMemo(
  () =>
    buildOverviewGraphEndpointParams<StackOverflowGraphParams>(
      {
        selectedSourceId: selectedQuestionId,
        startDate,
        endDate,
        interval: resolveOverviewGraphInterval(startDate, endDate),
      },
      "question_id" as any
    ),
  [selectedQuestionId, startDate, endDate],
);

  const graphQuery = useStackOverflowGraphQuery(graphParams);

  const dateRangeQuery =useStackOverflowDateRangeByQuestionQuery(selectedQuestionId);

  const { graphSeries, graphErrorMessage } =
    resolveOverviewGraphPresentation(
      graphQuery,
      "Failed to load the Stack Overflow chart.",
    );

  const isScoped = Boolean(selectedQuestionId);

  const statsItems = buildScopedOverviewMetricCardItems({
    overviewData: overviewQuery.data,
    isOverviewPending: overviewQuery.isPending,
    isSourceScoped: isScoped,
    allScopeConfig: ALL_CARD_CONFIG,
    sourceScopeConfig: SCOPED_CARD_CONFIG,
  });

  return (
    <OverviewLayout
      filters={
        <OverviewFilters
          idPrefix="stackoverflow-overview"
          sourceFilterLabel="Question"
          allSourcesOptionLabel="All questions"
          sourceOptions={questionOptions}
          selectedSourceId={selectedQuestionId}
          onSourceChange={setSelectedQuestionId}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          isSourceListPending={catalogQuery.isPending}
          dateRange={dateRangeQuery.data}
        />
      }
      chart={
        <OverviewChartSection
          title="Stack Overflow Activity"
          data={graphSeries}
          loading={graphQuery.isPending}
          error={graphErrorMessage}
          emptyMessage="No data found."
        />
      }
      stats={<OverviewStatsSection items={statsItems} />}
    />
  );
}
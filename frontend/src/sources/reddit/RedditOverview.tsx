import { useMemo, useState } from "react";

import {
  OverviewLayout,
  OverviewStatsSection,
  OverviewChartSection,
  OverviewFilters,
} from "@/components/overview";

import {
  useRedditOverviewQuery,
  useRedditGraphQuery,
} from "@/data";

import {
  resolveOverviewGraphInterval,
} from "@/sources/shared/OverviewShared";

import { buildSelectOptions } from "@/sources/shared/AllShared";

export default function RedditOverview() {

  const [selectedSubreddit, setSelectedSubreddit] = useState<string>("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const overviewQuery = useRedditOverviewQuery({
    startDate,
    endDate,
    subreddit: selectedSubreddit || undefined,
  });

  const graphParams = useMemo(
    () => ({
      startDate,
      endDate,
      interval: resolveOverviewGraphInterval(startDate, endDate),
      subreddit: selectedSubreddit || undefined,
    }),
    [startDate, endDate, selectedSubreddit],
  );

  const graphQuery = useRedditGraphQuery(graphParams);

  const stats = [
    {
      title: "Posts",
      number: overviewQuery.data?.posts_count ?? 0,
    },
    {
      title: "Comments",
      number: overviewQuery.data?.comments_count ?? 0,
    },
    {
      title: "Users",
      number: overviewQuery.data?.users_count ?? 0,
    },
  ];
  
  const subredditOptions = useMemo(
    () =>
      buildSelectOptions(overviewQuery.data?.subreddits ?? [], {
        getValue: (q) => String(q.id ?? q.name ?? ""),
        getLabel: (q) =>
          q.id ?? q.name ?? "Unknown",
      }),
    [overviewQuery.data?.subreddits],
  );


  return (
    <OverviewLayout
      filters={
        <OverviewFilters
          idPrefix="reddit-overview"
          sourceFilterLabel="Subreddit"
          allSourcesOptionLabel="All subreddits"
          sourceOptions={subredditOptions} 
          selectedSourceId={selectedSubreddit}
          onSourceChange={setSelectedSubreddit}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />  
      }
      stats={<OverviewStatsSection items={stats} />}
      chart={
        <OverviewChartSection
          title="Reddit Activity"
          data={graphQuery.data ?? []}
          loading={graphQuery.isPending}
          error={undefined}
          emptyMessage="No data found."
        />
      }
    />
  );
}
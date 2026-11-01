import type { CSSProperties } from "react";
import type { LineSeries } from "@/components/line-chart";
import type {
  Dashboard,
  DashboardGraphInterval,
  DashboardGraphs,
} from "@/data";

// Graph intervals supported by overview endpoints.
export type OverviewGraphInterval = DashboardGraphInterval;

const DAY_IN_MS = 1000 * 60 * 60 * 24;

// Choose graph aggregation interval from selected dates or backend date bounds.
export function resolveOverviewGraphInterval(
  startDate: string,
  endDate: string,
  dateRange?: { minDate?: string | null; maxDate?: string | null },
): OverviewGraphInterval {
  const resolvedStartDate = startDate || dateRange?.minDate || "";
  const resolvedEndDate = endDate || dateRange?.maxDate || "";
  const diffMs = Date.parse(resolvedEndDate) - Date.parse(resolvedStartDate);
  const diffDays = diffMs / DAY_IN_MS;
  return !resolvedStartDate || !resolvedEndDate
    ? "month"
    : !Number.isFinite(diffMs) || diffMs <= 0
      ? "day"
      : diffDays > 730
        ? "year"
        : diffDays > 24 * 7
          ? "month"
          : diffDays > 24
            ? "week"
            : "day";
}

// Generate dynamic rows for overview sidebar metric cards.
export function getOverviewSidebarGridRowsStyle(
  cardCount: number,
): CSSProperties {
  const safeCount =
    Number.isFinite(cardCount) && cardCount > 0 ? Math.floor(cardCount) : 1;

  return {
    gridTemplateRows: `repeat(${safeCount}, minmax(0, 1fr))`,
  };
}

// A card picked by key from one platform's dashboard.
export type DashboardCardPick = {
  dashboard: Dashboard | undefined;
  key: string;
  // Overrides the API's label.
  title?: string;
};

// Formats picked cards for `OverviewStatsSection`, keeping the API's labels.
// A missing card or a null value shows "-"; pending queries show "...".
export function buildDashboardCardItems(
  picks: readonly DashboardCardPick[],
  isLoading: boolean,
  locale = "en-US",
) {
  return picks.map(({ dashboard, key, title }) => {
    const card = dashboard?.cards.find((c) => c.key === key);
    const value = card?.value;
    let number: string;
    if (card?.type === "timestamp" && typeof value === "string") {
      number = new Date(value).toLocaleDateString(locale);
    } else if (typeof value === "number") {
      number = new Intl.NumberFormat(locale).format(value);
    } else if (typeof value === "string") {
      number = value;
    } else {
      number = isLoading && !dashboard ? "..." : "-";
    }
    return { title: title ?? card?.label ?? key, number };
  });
}

// A graph picked by key from one platform's graphs, optionally narrowed to
// some of its series.
export type DashboardGraphPick = {
  graphs: DashboardGraphs | undefined;
  key: string;
  series?: readonly string[];
};

// Converts picked graphs to `LineChart` series. Platforms return their own
// buckets, so the series are aligned on the union of buckets, in order, with
// zeros where a platform has no data (correct for per-interval graphs).
export function buildLineSeriesFromDashboardGraphs(
  picks: readonly DashboardGraphPick[],
): LineSeries[] {
  const buckets = new Set<string>();
  for (const { graphs } of picks) {
    graphs?.buckets.forEach((bucket) => buckets.add(bucket));
  }
  const allBuckets = [...buckets].sort();

  return picks.flatMap(({ graphs, key, series }) => {
    const graph = graphs?.graphs.find((g) => g.key === key);
    if (!graphs || !graph) return [];
    const index = new Map(graphs.buckets.map((bucket, i) => [bucket, i]));

    return graph.series
      .filter((s) => !series || series.includes(s.key))
      .map((s) => ({
        id: s.label,
        data: allBuckets.map((bucket) => {
          const i = index.get(bucket);
          return { x: bucket, y: i === undefined ? 0 : s.values[i] };
        }),
      }))
      .filter((s) => s.data.some((point) => point.y !== 0));
  });
}

import type { CSSProperties } from "react";
import type { LineSeries } from "@/components/line-chart";
import { getQueryErrorMessage } from "@/data";
import type {
  Dashboard,
  DashboardGraphInterval,
  DashboardGraphParams,
  DashboardGraphs,
} from "@/data";

// Graph intervals supported by overview endpoints.
export type OverviewGraphInterval = DashboardGraphInterval;

// Standard time-series shape used by multiple overview endpoints.
export type LabeledTimeSeriesPayload = {
  labels?: Array<string | number>;
  datasets?: Record<string, TimeSeriesRawPoint[]>;
};

// Raw values from API time-series arrays.
type TimeSeriesRawPoint = string | number | null;

type BuildLineSeriesFromTimeSeriesOptions = {
  labelFormatter?: (seriesKey: string) => string;
};

// Declarative metric card config.
export type OverviewMetricCardConfig<TData> = {
  title: string;
  getValue: (data: TData | undefined) => number | undefined;
};

type OverviewFilterParamsInput = {
  selectedSourceId: string;
  startDate: string;
  endDate: string;
};

type OverviewGraphFilterParamsInput = OverviewFilterParamsInput & {
  interval: OverviewGraphInterval;
};

type OverviewGraphQueryLike = {
  data?: unknown;
  isError: boolean;
  error: unknown;
};

type MutableOverviewParams = Record<string, unknown>;

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
  const interval =
    !resolvedStartDate || !resolvedEndDate
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

  console.debug("[Overview] graph interval resolved", {
    startDate,
    endDate,
    resolvedStartDate,
    resolvedEndDate,
    diffDays,
    interval,
  });

  return interval;
}

// Format numeric values for overview cards.
export function formatOverviewStatValue(
  value?: number,
  isLoading?: boolean,
  locale = "en-US",
) {
  if (value === undefined) return isLoading ? "..." : "-";

  return new Intl.NumberFormat(locale).format(value);
}

export function buildOverviewMetricCardItems<TData>(
  data: TData | undefined,
  isLoading: boolean,
  config: readonly OverviewMetricCardConfig<TData>[],
  locale = "en-US",
) {
  return config.map((item) => ({
    title: item.title,
    number: formatOverviewStatValue(item.getValue(data), isLoading, locale),
  }));
}

// Build overview endpoint params with optional source and date range.
export function buildOverviewEndpointParams<TParams extends Record<string, unknown>>(
  input: OverviewFilterParamsInput,
  sourceIdParamKey: Extract<keyof TParams, string>,
): TParams | undefined {
  const { selectedSourceId, startDate, endDate } = input;
  const params: MutableOverviewParams = {};

  if (selectedSourceId) {
    params[sourceIdParamKey] = selectedSourceId;
  }

  appendOptionalDateRangeFilters(params, startDate, endDate);

  return Object.keys(params).length > 0 ? (params as TParams) : undefined;
}

// Build graph endpoint params with required interval.
export function buildOverviewGraphEndpointParams<TSourceIdParamKey extends string>(
  input: OverviewGraphFilterParamsInput,
  sourceIdParamKey: TSourceIdParamKey,
): DashboardGraphParams<Partial<Record<TSourceIdParamKey, string>>> {
  const { selectedSourceId, startDate, endDate, interval } = input;
  const params: MutableOverviewParams = { interval };

  if (selectedSourceId) {
    params[sourceIdParamKey] = selectedSourceId;
  }

  appendOptionalDateRangeFilters(params, startDate, endDate);

  return params as DashboardGraphParams<
    Partial<Record<TSourceIdParamKey, string>>
  >;
}

export function buildScopedOverviewMetricCardItems<TData>(input: {
  overviewData: TData | undefined;
  isOverviewPending: boolean;
  isSourceScoped: boolean;
  allScopeConfig: readonly OverviewMetricCardConfig<TData>[];
  sourceScopeConfig: readonly OverviewMetricCardConfig<TData>[];
  locale?: string;
}) {
  const {
    overviewData,
    isOverviewPending,
    isSourceScoped,
    allScopeConfig,
    sourceScopeConfig,
    locale,
  } = input;

  const activeConfig = isSourceScoped ? sourceScopeConfig : allScopeConfig;

  return buildOverviewMetricCardItems(
    overviewData,
    isOverviewPending,
    activeConfig,
    locale,
  );
}

// Convert graph query response into chart series + UI error message.
export function resolveOverviewGraphPresentation(
  graphQuery: OverviewGraphQueryLike,
  fallbackErrorMessage: string,
) {
  const graphTimeSeries = (
    graphQuery.data as
      | {
          time_series?: LabeledTimeSeriesPayload | null;
        }
      | undefined
  )?.time_series;

  return {
    graphSeries: buildLineSeriesFromTimeSeries(graphTimeSeries),
    graphErrorMessage: graphQuery.isError
      ? getQueryErrorMessage(graphQuery.error, fallbackErrorMessage)
      : null,
  };
}

function appendOptionalDateRangeFilters(
  params: MutableOverviewParams,
  startDate: string,
  endDate: string,
) {
  if (startDate) {
    params.start_date = startDate;
  }

  if (endDate) {
    params.end_date = endDate;
  }
}

// Adapt `{ labels, datasets }` to `LineChart` data format.
export function buildLineSeriesFromTimeSeries(
  timeSeries?: LabeledTimeSeriesPayload | null,
  options?: BuildLineSeriesFromTimeSeriesOptions,
): LineSeries[] {
  if (!timeSeries?.labels || !timeSeries.datasets) return [];

  const labels = timeSeries.labels.map(String);
  const labelFormatter = options?.labelFormatter ?? humanizeOverviewSeriesKey;

  return Object.entries(timeSeries.datasets)
    .map(([seriesKey, values]) => {
      const data = values
        .map((value, index) => {
          const x = labels[index];
          const y = Number(value);

          if (!x || !Number.isFinite(y)) return null;
          return { x, y };
        })
        .filter(Boolean) as LineSeries["data"];

      return {
        id: labelFormatter(seriesKey),
        data,
      } satisfies LineSeries;
    })
    .filter((series) => series.data.length > 0);
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

// Convert keys like `open_issues` to `Open Issues`.
function humanizeOverviewSeriesKey(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// ==> Go dashboard contract (backend-go architecture.md §9.1).

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

// Types and helpers shared across modules (services and queries).

export type RequestOptions = {
  signal?: AbortSignal;
};

export type DateFilterRange = {
  start_date?: string;
  end_date?: string;
};

export type DashboardGraphInterval = "day" | "week" | "month" | "year";

export type DashboardGraphParams<TScope extends object = object> =
  DateFilterRange &
    TScope & {
      interval: DashboardGraphInterval;
    };

export type DashboardEntity = {
  id: string;
  name: string;
  count?: number;
};

// ==> Legacy (Django) dashboard contract, still used by the Jira and Stack
// Overflow modules. The Go contract follows below.

export type DashboardOverviewResponse = {
  selectedEntity?: DashboardEntity | null;
  entities?: DashboardEntity[];
  cards?: Record<string, number | undefined>;
  time_mined?: string | null;
};

export type DashboardGraphResponse = {
  selectedEntity?: DashboardEntity | null;
  interval?: DashboardGraphInterval;
  time_series?: {
    labels?: string[];
    datasets?: Record<string, number[]>;
  };
};

export type StandardCollectBody<
  CollectType extends string,
  Filters extends object = Record<string, never>,
  Options extends object = Record<string, never>,
> = {
  targets: string[];
  collect_types: CollectType[];
  start_date: string | null;
  end_date: string | null;
  filters: Filters;
  options: Options;
};

export type ApiDateRangeResponse = {
  selectedEntity?: DashboardEntity | null;
  date_range?: {
    min_date?: string | null;
    max_date?: string | null;
  };
};

// Lightweight option used by query hooks to enable/disable calls.
export type HookQueryOptions = {
  enabled?: boolean;
};

export type DateBounds = {
  minDate?: string;
  maxDate?: string;
};

export type DateInputBounds = {
  min?: string;
  max?: string;
};

// Normalizes the API date-range response to the simple UI format.
export function toDateBounds(
  response?: ApiDateRangeResponse | null,
): DateBounds {
  return {
    minDate: response?.date_range?.min_date ?? undefined,
    maxDate: response?.date_range?.max_date ?? undefined,
  };
}

// Converts UI date bounds to `<input type="date">` attributes.
export function getDateInputBounds(
  bounds?: DateBounds | null,
): DateInputBounds {
  return {
    min: bounds?.minDate ?? undefined,
    max: bounds?.maxDate ?? undefined,
  };
}

// ==> Go API contracts shared by every platform (backend-go architecture.md §9).

// huma's error body (RFC 9457 problem details).
export type ApiErrorBody = {
  title?: string;
  status?: number;
  detail?: string;
  errors?: { message?: string; location?: string; value?: unknown }[];
};

// Dashboard filters: `entity` is a repository ID for git and github; `since`
// is inclusive and `until` exclusive (RFC 3339).
export type DashboardFilter = {
  entity?: string;
  since?: string;
  until?: string;
};

export type DashboardGraphFilter = DashboardFilter & {
  interval: DashboardGraphInterval;
};

export type DashboardCard = {
  key: string;
  label: string;
  type: "integer" | "number" | "timestamp" | "text";
  value: number | string | null;
  windowed: boolean;
};

export type Dashboard = {
  platform: string;
  entity: DashboardEntity | null;
  entities: DashboardEntity[];
  cards: DashboardCard[];
  last_mined_at: string | null;
};

export type DashboardSeries = {
  key: string;
  label: string;
  values: number[];
};

export type DashboardGraph = {
  key: string;
  label: string;
  cumulative: boolean;
  series: DashboardSeries[];
};

export type DashboardGraphs = {
  platform: string;
  entity: DashboardEntity | null;
  interval: DashboardGraphInterval;
  buckets: string[];
  graphs: DashboardGraph[];
};

export type DashboardDateRange = {
  platform: string;
  entity: DashboardEntity | null;
  first_at: string | null;
  last_at: string | null;
};

// Converts `<input type="date">` values (YYYY-MM-DD, inclusive on both ends
// in the UI) to the API's window: since at the start of the first day, until
// at the start of the day after the last (exclusive), both in UTC.
export function toApiSince(date: string): string | undefined {
  return date ? `${date}T00:00:00Z` : undefined;
}

export function toApiUntil(date: string): string | undefined {
  if (!date) return undefined;
  const next = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(next.getTime())) return undefined;
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().replace(".000Z", "Z");
}

// UTC calendar date of an RFC 3339 timestamp, for date inputs.
function toUtcDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? undefined
    : parsed.toISOString().slice(0, 10);
}

// Merges the date ranges of several platforms into date-input bounds.
export function mergeDateRanges(
  ranges: readonly (DashboardDateRange | undefined)[],
): DateBounds {
  const firsts = ranges.map((r) => toUtcDate(r?.first_at)).filter(Boolean) as string[];
  const lasts = ranges.map((r) => toUtcDate(r?.last_at)).filter(Boolean) as string[];
  return {
    minDate: firsts.length ? firsts.sort()[0] : undefined,
    maxDate: lasts.length ? lasts.sort()[lasts.length - 1] : undefined,
  };
}

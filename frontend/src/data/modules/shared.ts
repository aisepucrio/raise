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

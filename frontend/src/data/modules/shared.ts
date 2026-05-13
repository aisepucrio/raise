// Types and helpers shared across modules (services and queries).

export type RequestOptions = {
  signal?: AbortSignal;
};

export type DateFilterRange = {
  start_date?: string;
  end_date?: string;
};

export type ApiDateRangeResponse = {
  min_date?: string | null;
  max_date?: string | null;
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
export function toDateBounds(response?: ApiDateRangeResponse | null): DateBounds {
  return {
    minDate: response?.min_date ?? undefined,
    maxDate: response?.max_date ?? undefined,
  };
}

// Converts UI date bounds to `<input type="date">` attributes.
export function getDateInputBounds(bounds?: DateBounds | null): DateInputBounds {
  return {
    min: bounds?.minDate ?? undefined,
    max: bounds?.maxDate ?? undefined,
  };
}

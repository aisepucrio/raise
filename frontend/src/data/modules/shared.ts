// types and helpers shareds between modules (services and queries).

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

// option enxuta used pelos hooks of query for ligar/desligar Callsdas.
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

// normalizes the response of date-range of the API for the format simple used in the UI.
export function toDateBounds(response?: ApiDateRangeResponse | null): DateBounds {
  return {
    minDate: response?.min_date ?? undefined,
    maxDate: response?.max_date ?? undefined,
  };
}

// converts bounds of the UI for atributos of `<input type="date">`.
export function getDateInputBounds(bounds?: DateBounds | null): DateInputBounds {
  return {
    min: bounds?.minDate ?? undefined,
    max: bounds?.maxDate ?? undefined,
  };
}

export type StartEndDateRange = {
  minDate?: string | null;
  maxDate?: string | null;
};

export type ResolvedStartEndDateState = {
  startDate: string;
  endDate: string;
  startMin?: string;
  startMax?: string;
  endMin?: string;
  endMax?: string;
};

// Normalizes `YYYY-MM-DD` or ISO datetime to date-input format.
function toInputDate(value?: string | null): string | undefined {
  if (!value) return undefined;

  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return undefined;

  return parsedDate.toISOString().slice(0, 10);
}

// Clears value if it falls outside the allowed range.
function keepDateWithinRange(value: string, min?: string, max?: string) {
  if (!value) return "";
  if (min && value < min) return "";
  if (max && value > max) return "";
  return value;
}

export function resolveStartEndDateState({
  startDate,
  endDate,
  dateRange,
}: {
  startDate: string;
  endDate: string;
  dateRange?: StartEndDateRange;
}): ResolvedStartEndDateState {
  // Bounds returned by the `/date-range` endpoint.
  const minDate = toInputDate(dateRange?.minDate);
  const maxDate = toInputDate(dateRange?.maxDate);

  // Removes dates that do not belong to the absolute range.
  const nextStartDate = keepDateWithinRange(startDate, minDate, maxDate);
  let nextEndDate = keepDateWithinRange(endDate, minDate, maxDate);

  // Base rule: start cannot be greater than end.
  if (nextStartDate && nextEndDate && nextStartDate > nextEndDate) {
    nextEndDate = "";
  }

  return {
    startDate: nextStartDate,
    endDate: nextEndDate,
    // Without an end date, start respects only the absolute range upper bound.
    startMin: minDate,
    startMax: nextEndDate || maxDate,
    // Without a start date, end respects only the absolute range lower bound.
    endMin: nextStartDate || minDate,
    endMax: maxDate,
  };
}

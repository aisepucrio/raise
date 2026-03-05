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

// normalizes `YYYY-MM-DD` ou ISO datetime for the format of the input of date.
function toInputDate(value?: string | null): string | undefined {
  if (!value) return undefined;

  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return undefined;

  return parsedDate.toISOString().slice(0, 10);
}

// clears the value se ele cair outside of the interval permitido.
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
  // Bounds vindos of the endpoint `/date-range`.
  const minDate = toInputDate(dateRange?.minDate);
  const maxDate = toInputDate(dateRange?.maxDate);

  // removes dates that not pertencem to interval absoluto.
  const nextStartDate = keepDateWithinRange(startDate, minDate, maxDate);
  let nextEndDate = keepDateWithinRange(endDate, minDate, maxDate);

  // rule base: start not pode ser maior that end.
  if (nextStartDate && nextEndDate && nextStartDate > nextEndDate) {
    nextEndDate = "";
  }

  return {
    startDate: nextStartDate,
    endDate: nextEndDate,
    // without end definido, the start respeita only the teto absoluto of the range.
    startMin: minDate,
    startMax: nextEndDate || maxDate,
    // without start definido, the end respeita only the piso absoluto of the range.
    endMin: nextStartDate || minDate,
    endMax: maxDate,
  };
}

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

// Normaliza `YYYY-MM-DD` ou ISO datetime para o formato do input de data.
function toInputDate(value?: string | null): string | undefined {
  if (!value) return undefined;

  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return undefined;

  return parsedDate.toISOString().slice(0, 10);
}

// Limpa o valor se ele cair fora do intervalo permitido.
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
  // Bounds vindos do endpoint `/date-range`.
  const minDate = toInputDate(dateRange?.minDate);
  const maxDate = toInputDate(dateRange?.maxDate);

  // Remove datas que não pertencem ao intervalo absoluto.
  const nextStartDate = keepDateWithinRange(startDate, minDate, maxDate);
  let nextEndDate = keepDateWithinRange(endDate, minDate, maxDate);

  // Regra base: start não pode ser maior que end.
  if (nextStartDate && nextEndDate && nextStartDate > nextEndDate) {
    nextEndDate = "";
  }

  return {
    startDate: nextStartDate,
    endDate: nextEndDate,
    // Sem end definido, o start respeita só o teto absoluto do range.
    startMin: minDate,
    startMax: nextEndDate || maxDate,
    // Sem start definido, o end respeita só o piso absoluto do range.
    endMin: nextStartDate || minDate,
    endMax: maxDate,
  };
}

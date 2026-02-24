// Tipos e funções compartilhados entre os serviços.

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

// Converte data da API para o formato aceito por <input type="date" />.
function toInputDate(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
}

export function getDateInputBounds(data?: ApiDateRangeResponse | null) {
  return {
    minDate: toInputDate(data?.min_date),
    maxDate: toInputDate(data?.max_date),
  };
}

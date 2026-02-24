// Tipos e helpers compartilhados entre modules (services e queries).

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

// Opção enxuta usada pelos hooks de query para ligar/desligar chamadas.
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

// Normaliza a resposta de date-range da API para um formato simples usado na UI.
export function toDateBounds(response?: ApiDateRangeResponse | null): DateBounds {
  return {
    minDate: response?.min_date ?? undefined,
    maxDate: response?.max_date ?? undefined,
  };
}

// Converte bounds da UI para atributos de `<input type="date">`.
export function getDateInputBounds(bounds?: DateBounds | null): DateInputBounds {
  return {
    min: bounds?.minDate ?? undefined,
    max: bounds?.maxDate ?? undefined,
  };
}

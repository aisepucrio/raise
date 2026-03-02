type FormatDateItemProps = {
  value?: string | null;
  locale?: string;
};

export type DateBoundMode = "min" | "max";

// Tenta parsear formatos comuns vindos da API/UI sem depender do parser nativo em casos ambíguos.
function parseDateValue(value?: string | null): Date | null {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  // Caso ISO com data apenas (YYYY-MM-DD), criar em horário local para evitar deslocamento de fuso.
  const isoDateOnlyMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnlyMatch) {
    const year = Number(isoDateOnlyMatch[1]);
    const month = Number(isoDateOnlyMatch[2]);
    const day = Number(isoDateOnlyMatch[3]);

    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Caso dia/mês/ano (ex.: 02/02/2026). Aqui assumimos padrão BR por clareza.
  const brDateMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDateMatch) {
    const day = Number(brDateMatch[1]);
    const month = Number(brDateMatch[2]);
    const year = Number(brDateMatch[3]);

    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Fallback para formatos completos com horário/timezone (ISO datetime etc.).
  const parsedDate = new Date(trimmedValue);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return parsedDate;
}

export function formatDateItemValue(
  value?: string | null,
  locale = "en-US",
): string {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return typeof value === "string" && value.trim() ? value : "";
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

// Resolve um limite de data a partir de uma lista (útil para combinar limites dinâmicos).
export function resolveDateBound(
  values: Array<string | null | undefined>,
  mode: DateBoundMode,
) {
  const validValues = values.filter(Boolean) as string[];
  if (validValues.length === 0) return undefined;

  return validValues.reduce((currentValue, nextValue) =>
    mode === "min"
      ? nextValue < currentValue
        ? nextValue
        : currentValue
      : nextValue > currentValue
        ? nextValue
        : currentValue,
  );
}

// Verifica se uma data está fora de um intervalo [min, max].
export function isDateOutsideRange(value: string, min?: string, max?: string) {
  if (!value) return false;
  if (min && value < min) return true;
  if (max && value > max) return true;
  return false;
}

export function FormatDateItem({
  value,
  locale = "en-US",
}: FormatDateItemProps) {
  const formattedValue = formatDateItemValue(value, locale);

  return <span title={typeof value === "string" ? value : undefined}>{formattedValue}</span>;
}

export type { FormatDateItemProps };

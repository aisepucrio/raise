export type FormatDateItemProps = {
  value?: string | null;
  locale?: string;
};

// Tenta parsear formatos comuns vindos of the API/UI without depender of the parser nativo in cases ambiguous.
function parseDateValue(value?: string | null): Date | null {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  // Caso ISO with date only (YYYY-MM-DD), criar in time local to avoid deslocamento of fuso.
  const isoDateOnlyMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnlyMatch) {
    const year = Number(isoDateOnlyMatch[1]);
    const month = Number(isoDateOnlyMatch[2]);
    const day = Number(isoDateOnlyMatch[3]);

    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Caso dia/month/ano (ex.: 02/02/2026). here assumimos standard BR for clareza.
  const brDateMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDateMatch) {
    const day = Number(brDateMatch[1]);
    const month = Number(brDateMatch[2]);
    const year = Number(brDateMatch[3]);

    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Fallback for formatos completos with time/timezone (ISO datetime etc.).
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

export function FormatDateItem({
  value,
  locale = "en-US",
}: FormatDateItemProps) {
  const formattedValue = formatDateItemValue(value, locale);

  return <span title={typeof value === "string" ? value : undefined}>{formattedValue}</span>;
}

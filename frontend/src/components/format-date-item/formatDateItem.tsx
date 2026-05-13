export type FormatDateItemProps = {
  value?: string | null;
  locale?: string;
};

// Tries to parse common formats from API/UI without depending on native parser behavior in ambiguous cases.
function parseDateValue(value?: string | null): Date | null {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  // ISO date-only case (YYYY-MM-DD): create in local time to avoid timezone shifts.
  const isoDateOnlyMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnlyMatch) {
    const year = Number(isoDateOnlyMatch[1]);
    const month = Number(isoDateOnlyMatch[2]);
    const day = Number(isoDateOnlyMatch[3]);

    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Day/month/year case (for example: 02/02/2026). We assume BR format for clarity.
  const brDateMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDateMatch) {
    const day = Number(brDateMatch[1]);
    const month = Number(brDateMatch[2]);
    const year = Number(brDateMatch[3]);

    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Fallback for full formats with time/timezone (ISO datetime, etc.).
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

import { toast } from "@/components/toast";
import { getQueryErrorMessage } from "@/data";

export type PreviewRow = Record<string, unknown>;

export type PreviewDateFilters = {
  startDate: string;
  endDate: string;
};

export type PreviewBuildParamsInput = {
  page: number;
  rowsPerPage: number;
  selectedSourceId?: string;
  search: string;
  ordering?: string;
  dateFilters?: PreviewDateFilters;
};

type PreviewSortStateLike = {
  field: string;
  direction: "asc" | "desc";
} | null;

type DownloadPreviewExportFileOptions = {
  exportPayload: unknown;
  fileNamePrefix: string;
  extension?: string;
  mimeType?: string;
};

type PreviewTableState = {
  columns: string[];
  visibleColumns: string[];
  tableColumns: string[];
};

type RunPreviewExportWithFeedbackOptions = {
  execute: () => Promise<unknown>;
  fileNamePrefix: string;
  successMessage: string;
  errorFallbackMessage?: string;
};

// Detects ISO date strings to improve table display.
export function isIsoDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(
    value,
  );
}

// Formats an ISO date using the browser locale, with safe fallback.
export function formatIsoDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

// Converts any cell value into a readable string (UI and modal).
export function toPreviewString(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// Generates a consistent filename for preview exports.
export function buildPreviewExportFileName(
  fileNamePrefix: string,
  extension = "json",
) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  return `${fileNamePrefix}-${timestamp}.${extension}`;
}

// Normalizes export payload into a Blob.
export function toPreviewExportBlob(
  exportPayload: unknown,
  mimeType = "application/json",
) {
  if (exportPayload instanceof Blob) return exportPayload;

  return new Blob([toPreviewString(exportPayload)], {
    type: mimeType,
  });
}

// Downloads the exported file in the browser.
export function downloadPreviewExportFile({
  exportPayload,
  fileNamePrefix,
  extension = "json",
  mimeType = "application/json",
}: DownloadPreviewExportFileOptions) {
  const exportBlob = toPreviewExportBlob(exportPayload, mimeType);
  const fileName = buildPreviewExportFileName(fileNamePrefix, extension);

  const objectUrl = URL.createObjectURL(exportBlob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

// Displays preview errors with a standard fallback.
export function showPreviewErrorToast(
  error: unknown,
  fallbackMessage: string,
): void {
  toast.error(undefined, {
    description: getQueryErrorMessage(error, fallbackMessage),
  });
}

// Executes export with standard success/error feedback.
export async function runPreviewExportWithFeedback({
  execute,
  fileNamePrefix,
  successMessage,
  errorFallbackMessage = "Failed to export preview.",
}: RunPreviewExportWithFeedbackOptions): Promise<void> {
  try {
    const exportPayload = await execute();
    downloadPreviewExportFile({
      exportPayload,
      fileNamePrefix,
    });

    toast.success(undefined, {
      description: successMessage,
    });
  } catch (error) {
    showPreviewErrorToast(error, errorFallbackMessage);
  }
}

// Converts sort state to the format expected by the backend.
export function resolvePreviewOrdering(sortState: PreviewSortStateLike) {
  if (!sortState?.field) return undefined;

  return sortState.direction === "asc"
    ? sortState.field
    : `-${sortState.field}`;
}

// Toggles sort state for a column.
export function togglePreviewSortState(
  currentSortState: PreviewSortStateLike,
  field: string,
): PreviewSortStateLike {
  if (!currentSortState || currentSortState.field !== field) {
    return { field, direction: "asc" };
  }

  return {
    field,
    direction: currentSortState.direction === "asc" ? "desc" : "asc",
  };
}

// Resolves available columns from the current payload.
function collectPreviewColumns(rows: PreviewRow[]) {
  const keys = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => keys.add(key));
  });
  return Array.from(keys);
}

// Removes columns hidden by the user.
function filterPreviewVisibleColumns(
  columns: string[],
  hiddenColumns: string[],
) {
  return columns.filter((column) => !hiddenColumns.includes(column));
}

// Ensures a fallback when all columns are hidden.
function resolvePreviewTableColumns(visibleColumns: string[]) {
  return visibleColumns.length > 0 ? visibleColumns : ["_fallback"];
}

// Validates whether current sorting still exists among visible columns.
export function isPreviewSortInvalid(
  sortState: PreviewSortStateLike,
  columns: string[],
  hiddenColumns: string[],
) {
  if (!sortState) return false;
  if (columns.length === 0) return false;

  return (
    !columns.includes(sortState.field) ||
    hiddenColumns.includes(sortState.field)
  );
}

// Resolves table columns from rows and hidden-column settings.
export function resolvePreviewTableState(
  rows: PreviewRow[],
  hiddenColumns: string[],
): PreviewTableState {
  const columns = collectPreviewColumns(rows);
  const visibleColumns = filterPreviewVisibleColumns(columns, hiddenColumns);
  const tableColumns = resolvePreviewTableColumns(visibleColumns);

  return {
    columns,
    visibleColumns,
    tableColumns,
  };
}

// Column-width heuristic by column type to reduce visual clipping.
export function resolveColumnWidth(column: string) {
  const normalized = column.toLowerCase();

  if (
    normalized === "id" ||
    normalized.endsWith("_id") ||
    normalized.endsWith("number")
  ) {
    return "10rem";
  }

  if (
    normalized.includes("date") ||
    normalized.endsWith("_at") ||
    normalized.endsWith("time")
  ) {
    return "14rem";
  }

  return "25rem";
}

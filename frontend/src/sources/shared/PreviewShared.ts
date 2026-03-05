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

// Detecta strings of date in format ISO for Improve display in the table.
export function isIsoDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(
    value,
  );
}

// Formata date ISO for the locale of the navegador mantendo fallback safe.
export function formatIsoDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

// converts any value of cell for string readable (UI and modal).
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

// generates nome of arquivo consistent for exports of preview.
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

// normalizes payload of export for Blob.
export function toPreviewExportBlob(
  exportPayload: unknown,
  mimeType = "application/json",
) {
  if (exportPayload instanceof Blob) return exportPayload;

  return new Blob([toPreviewString(exportPayload)], {
    type: mimeType,
  });
}

// Faz the download of the arquivo exportado in the browser.
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

// displays error of preview with fallback standard.
export function showPreviewErrorToast(
  error: unknown,
  fallbackMessage: string,
): void {
  toast.error(undefined, {
    description: getQueryErrorMessage(error, fallbackMessage),
  });
}

// executes export with feedback standard of success/error.
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

// converts state of sort for format esperado pelo backend.
export function resolvePreviewOrdering(sortState: PreviewSortStateLike) {
  if (!sortState?.field) return undefined;

  return sortState.direction === "asc"
    ? sortState.field
    : `-${sortState.field}`;
}

// Alterna state of sort for the column.
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

// resolves columns available with base in the payload atual.
function collectPreviewColumns(rows: PreviewRow[]) {
  const keys = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => keys.add(key));
  });
  return Array.from(keys);
}

// removes columns hidden selecionadas pelo user.
function filterPreviewVisibleColumns(
  columns: string[],
  hiddenColumns: string[],
) {
  return columns.filter((column) => !hiddenColumns.includes(column));
}

// Garante fallback when entires the columns estiverem hidden.
function resolvePreviewTableColumns(visibleColumns: string[]) {
  return visibleColumns.length > 0 ? visibleColumns : ["_fallback"];
}

// validates se the sort atual ainda existe between the columns visible.
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

// resolves columns of the table the partir of the rows and of the columns hidden.
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

// heuristic of width for tipo of column for reduzir cortes visual.
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

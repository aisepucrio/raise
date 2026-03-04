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

// Detecta strings de data em formato ISO para melhorar exibição na tabela.
export function isIsoDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(
    value,
  );
}

// Formata data ISO para o locale do navegador mantendo fallback seguro.
export function formatIsoDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

// Converte qualquer valor de célula para string legível (UI e modal).
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

// Gera nome de arquivo consistente para exports de preview.
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

// Normaliza payload de export para Blob.
export function toPreviewExportBlob(
  exportPayload: unknown,
  mimeType = "application/json",
) {
  if (exportPayload instanceof Blob) return exportPayload;

  return new Blob([toPreviewString(exportPayload)], {
    type: mimeType,
  });
}

// Faz o download do arquivo exportado no browser.
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

// Exibe erro de preview com fallback padrão.
export function showPreviewErrorToast(
  error: unknown,
  fallbackMessage: string,
): void {
  toast.error(undefined, {
    description: getQueryErrorMessage(error, fallbackMessage),
  });
}

// Executa export com feedback padrão de sucesso/erro.
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

// Converte estado de sort para formato esperado pelo backend.
export function resolvePreviewOrdering(sortState: PreviewSortStateLike) {
  if (!sortState?.field) return undefined;

  return sortState.direction === "asc"
    ? sortState.field
    : `-${sortState.field}`;
}

// Alterna estado de sort para uma coluna.
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

// Resolve colunas disponíveis com base no payload atual.
function collectPreviewColumns(rows: PreviewRow[]) {
  const keys = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => keys.add(key));
  });
  return Array.from(keys);
}

// Remove colunas ocultas selecionadas pelo usuário.
function filterPreviewVisibleColumns(
  columns: string[],
  hiddenColumns: string[],
) {
  return columns.filter((column) => !hiddenColumns.includes(column));
}

// Garante fallback quando todas as colunas estiverem ocultas.
function resolvePreviewTableColumns(visibleColumns: string[]) {
  return visibleColumns.length > 0 ? visibleColumns : ["_fallback"];
}

// Valida se o sort atual ainda existe entre as colunas visíveis.
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

// Resolve colunas da tabela a partir das linhas e das colunas ocultas.
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

// Heurística de largura por tipo de coluna para reduzir cortes visuais.
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

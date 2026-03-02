export type PreviewRow = Record<string, unknown>;

type DownloadPreviewExportFileOptions = {
  exportPayload: unknown;
  fileNamePrefix: string;
  extension?: string;
  mimeType?: string;
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

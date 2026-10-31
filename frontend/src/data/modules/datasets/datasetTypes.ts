// Datasets: every mined table served flat for preview and export
// (backend-go architecture.md §9.2).

export type DatasetColumn = {
  name: string;
  type: string;
  filters?: string[];
  sortable: boolean;
  searchable: boolean;
};

export type DatasetInfo = {
  name: string;
  description?: string;
  key: string[];
  time_column?: string | null;
  columns: DatasetColumn[];
};

export type DatasetRow = Record<string, unknown>;

export type DatasetPage = {
  platform: string;
  dataset: string;
  count: number;
  limit: number;
  offset: number;
  results: DatasetRow[];
};

// Filters shared by previews and exports. Column filters are named after the
// column (`state=open`, `star_count_min=`); repeat a value for "any of".
export type DatasetFilters = {
  search?: string;
  sort?: string;
  // On the dataset's time column: RFC 3339 or YYYY-MM-DD, until exclusive.
  since?: string;
  until?: string;
  columns?: Record<string, string | number | boolean | (string | number)[]>;
};

export type DatasetPreviewParams = DatasetFilters & {
  limit: number;
  offset: number;
};

export type DatasetExportFormat = "csv" | "json" | "jsonl";

// Builds the query string the API expects, with repeated keys for arrays.
export function toDatasetSearchParams(
  filters: DatasetFilters & { limit?: number; offset?: number; format?: string },
) {
  const params = new URLSearchParams();
  const { columns, ...rest } = filters;

  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  for (const [key, value] of Object.entries(columns ?? {})) {
    for (const item of Array.isArray(value) ? value : [value]) {
      params.append(key, String(item));
    }
  }
  return params;
}

import { api, apiUrl } from "../../api/apiClient";
import { endpoints, type PlatformId } from "../../api/endpoints";
import type { RequestOptions } from "../shared";
import {
  toDatasetSearchParams,
  type DatasetExportFormat,
  type DatasetFilters,
  type DatasetInfo,
  type DatasetPage,
  type DatasetPreviewParams,
} from "./datasetTypes";

export const datasetService = {
  // The platform's datasets with their typed columns and filter parameters.
  getCatalogue: (platform: PlatformId, options?: RequestOptions) =>
    api.get<DatasetInfo[], DatasetInfo[]>(endpoints.datasets(platform), {
      signal: options?.signal,
    }),

  getPreview: (
    platform: PlatformId,
    dataset: string,
    params: DatasetPreviewParams,
    options?: RequestOptions,
  ) =>
    api.get<DatasetPage, DatasetPage>(
      endpoints.datasetPreview(platform, dataset),
      { params: toDatasetSearchParams(params), signal: options?.signal },
    ),
};

// URL of a full export with the same filters as the preview. It is a
// same-origin GET carrying the session cookie, so a plain link downloads it,
// streamed, with the API's Content-Disposition filename.
export function buildDatasetExportUrl(
  platform: PlatformId,
  dataset: string,
  format: DatasetExportFormat,
  filters: DatasetFilters,
) {
  return apiUrl(
    endpoints.datasetExport(platform, dataset),
    toDatasetSearchParams({ ...filters, format }),
  );
}

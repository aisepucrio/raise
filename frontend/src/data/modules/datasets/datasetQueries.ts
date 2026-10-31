import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PlatformId } from "../../api/endpoints";
import { queryKeys } from "../../query/keys";
import type { HookQueryOptions } from "../shared";
import { datasetService } from "./datasetService";
import type { DatasetPreviewParams } from "./datasetTypes";

// Dataset definitions change only with the backend, so they're cached long.
export function useDatasetCatalogueQuery(platform: PlatformId) {
  return useQuery({
    queryKey: queryKeys.datasets.catalogue(platform),
    queryFn: ({ signal }) => datasetService.getCatalogue(platform, { signal }),
    staleTime: 60 * 60_000,
  });
}

export function useDatasetPreviewQuery(
  platform: PlatformId,
  dataset: string,
  params: DatasetPreviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.datasets.preview(platform, dataset, params),
    enabled: options?.enabled,
    // Keeps current table data while filter/sort/page changes.
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      datasetService.getPreview(platform, dataset, params, { signal }),
  });
}

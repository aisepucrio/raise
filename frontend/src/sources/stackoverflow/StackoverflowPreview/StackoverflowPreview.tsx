import { useCallback } from "react";

import {
  PreviewScreen,
  type PreviewScreenBuildParamsInput,
} from "@/components/preview-screen";
import type { StackOverflowSection } from "@/data/api/endpoints";
import { useStackOverflowExportMutation } from "@/data/modules/stackoverflow/stackoverflowMutations";
import { useStackOverflowPreviewQuery } from "@/data/modules/stackoverflow/stackoverflowQueries";
import type { StackOverflowPreviewParams } from "@/data/modules/stackoverflow/stackoverflowService";

type StackoverflowPreviewProps = {
  idPrefix: string;
  previewSection: StackOverflowSection;
  itemsLabel: string;
  emptyStateMessage: string;
  loadErrorMessage: string;
  exportFileNamePrefix: string;
  exportSuccessMessage?: string;
  showDateFilters?: boolean;
};

export function StackoverflowPreview({
  idPrefix,
  previewSection,
  itemsLabel,
  emptyStateMessage,
  loadErrorMessage,
  exportFileNamePrefix,
  exportSuccessMessage = "Stack Overflow preview exported successfully.",
  showDateFilters = true,
}: StackoverflowPreviewProps) {
  // Queries e actions da tela.
  const previewExportMutation = useStackOverflowExportMutation();

  // Monta o payload da query de preview baseado nos estados compartilhados do PreviewScreen.
  const buildPreviewParams = useCallback(
    ({
      page,
      rowsPerPage,
      search,
      ordering,
      dateFilters,
    }: PreviewScreenBuildParamsInput): StackOverflowPreviewParams => ({
      page,
      page_size: rowsPerPage,
      ...(search ? { search } : {}),
      ...(ordering ? { ordering } : {}),
      ...(showDateFilters && dateFilters
        ? {
            ...(dateFilters.startDate
              ? { creation_date__gte: dateFilters.startDate }
              : {}),
            ...(dateFilters.endDate
              ? { creation_date__lte: dateFilters.endDate }
              : {}),
          }
        : {}),
    }),
    [showDateFilters],
  );

  // O payload de exportação é idêntico ao de preview, mas sem paginação.
  const requestExportPayload = useCallback(
    () => previewExportMutation.mutateAsync(),
    [previewExportMutation],
  );

  return (
    <PreviewScreen
      idPrefix={idPrefix}
      previewSection={previewSection}
      itemsLabel={itemsLabel}
      emptyStateMessage={emptyStateMessage}
      loadErrorMessage={loadErrorMessage}
      exportFileNamePrefix={exportFileNamePrefix}
      exportSuccessMessage={exportSuccessMessage}
      showSourceFilter={false}
      showDateFilters={showDateFilters}
      usePreviewBySourceQuery={useStackOverflowPreviewQuery}
      buildPreviewParams={buildPreviewParams}
      requestExportPayload={requestExportPayload}
      isExportPending={previewExportMutation.isPending}
    />
  );
}

export type { StackoverflowPreviewProps };

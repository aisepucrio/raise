import { useCallback, useMemo } from "react";

import {
  PreviewScreen,
  type PreviewScreenBuildParamsInput,
} from "@/components/preview-screen";
import type { GithubSection } from "@/data/api/endpoints";
import { useGithubExportMutation } from "@/data/modules/github/githubMutations";
import {
  useGithubDateRangeByRepositoryQuery,
  useGithubOverviewQuery,
  useGithubPreviewQuery,
} from "@/data/modules/github/githubQueries";
import type { GithubPreviewParams } from "@/data/modules/github/githubService";
import { buildSelectOptions } from "@/sources/shared/AllShared";

type GithubPreviewDateFilterField = "created_at" | "date";

type GithubPreviewProps = {
  idPrefix: string;
  previewSection: GithubSection;
  itemsLabel: string;
  emptyStateMessage: string;
  loadErrorMessage: string;
  exportTable: string;
  exportDataType?: string;
  exportFileNamePrefix: string;
  exportSuccessMessage?: string;
  dateFilterField?: GithubPreviewDateFilterField;
  showDateFilters?: boolean;
};

function buildDateFilterParams(
  dateFilterField: GithubPreviewDateFilterField,
  startDate: string,
  endDate: string,
): Partial<GithubPreviewParams> {
  if (dateFilterField === "created_at") {
    return {
      ...(startDate ? { github_created_at__gte: startDate } : {}),
      ...(endDate ? { github_created_at__lte: endDate } : {}),
    };
  }

  return {
    ...(startDate ? { date__gte: startDate } : {}),
    ...(endDate ? { date__lte: endDate } : {}),
  };
}

export function GithubPreview({
  idPrefix,
  previewSection,
  itemsLabel,
  emptyStateMessage,
  loadErrorMessage,
  exportTable,
  exportDataType,
  exportFileNamePrefix,
  exportSuccessMessage = "GitHub preview exported successfully.",
  dateFilterField,
  showDateFilters = true,
}: GithubPreviewProps) {
  // Queries e actions da tela.
  const { data: overviewData, isPending: isRepositoryListPending } =
    useGithubOverviewQuery();
  const previewExportMutation = useGithubExportMutation();

  // Opções do select de repositórios no formato padrão do FormSelect.
  const repositoryOptions = useMemo(
    () =>
      buildSelectOptions(overviewData?.repositories, {
        getValue: (repository) => repository.id,
        getLabel: (repository) => repository.repository,
      }),
    [overviewData?.repositories],
  );

  // Monta o payload da query de preview baseado nos estados compartilhados do PreviewScreen.
  const buildPreviewParams = useCallback(
    ({
      page,
      rowsPerPage,
      selectedSourceId,
      search,
      ordering,
      dateFilters,
    }: PreviewScreenBuildParamsInput): GithubPreviewParams => ({
      page,
      page_size: rowsPerPage,
      ...(selectedSourceId ? { repository: selectedSourceId } : {}),
      ...(search ? { search } : {}),
      ...(ordering ? { ordering } : {}),
      ...(showDateFilters && dateFilterField && dateFilters
        ? buildDateFilterParams(
            dateFilterField,
            dateFilters.startDate,
            dateFilters.endDate,
          )
        : {}),
    }),
    [showDateFilters, dateFilterField],
  );

  // Monta o payload da exportação baseado nos estados compartilhados do PreviewScreen.
  const requestExportPayload = useCallback(
    () =>
      previewExportMutation.mutateAsync({
        format: "json",
        table: exportTable,
        ...(exportDataType ? { data_type: exportDataType } : {}),
      }),
    [previewExportMutation, exportTable, exportDataType],
  );

  return (
    <PreviewScreen
      idPrefix={idPrefix}
      previewSection={previewSection}
      sourceFilterLabel="Repository"
      allSourcesOptionLabel="All repositories"
      sourceOptions={repositoryOptions}
      isSourceListPending={isRepositoryListPending}
      itemsLabel={itemsLabel}
      emptyStateMessage={emptyStateMessage}
      loadErrorMessage={loadErrorMessage}
      exportFileNamePrefix={exportFileNamePrefix}
      exportSuccessMessage={exportSuccessMessage}
      showDateFilters={showDateFilters}
      useDateRangeBySourceQuery={useGithubDateRangeByRepositoryQuery}
      usePreviewBySourceQuery={useGithubPreviewQuery}
      buildPreviewParams={buildPreviewParams}
      requestExportPayload={requestExportPayload}
      isExportPending={previewExportMutation.isPending}
    />
  );
}

export type { GithubPreviewDateFilterField, GithubPreviewProps };

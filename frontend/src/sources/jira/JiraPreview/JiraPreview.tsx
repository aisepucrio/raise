import { useCallback, useMemo } from "react";

import {
  PreviewScreen,
  type PreviewScreenBuildParamsInput,
} from "@/components/preview-screen";
import type { JiraSection } from "@/data/api/endpoints";
import { useJiraExportMutation } from "@/data/modules/jira/jiraMutations";
import {
  useJiraDateRangeByProjectQuery,
  useJiraOverviewQuery,
  useJiraPreviewQuery,
} from "@/data/modules/jira/jiraQueries";
import type {
  JiraOverviewProject,
  JiraPreviewParams,
} from "@/data/modules/jira/jiraService";

type JiraPreviewDateFilterField = "created" | "updated_at" | "sprint";

type JiraPreviewProps = {
  idPrefix: string;
  previewSection: JiraSection;
  itemsLabel: string;
  emptyStateMessage: string;
  loadErrorMessage: string;
  exportFileNamePrefix: string;
  exportSuccessMessage?: string;
  dateFilterField?: JiraPreviewDateFilterField;
  showDateFilters?: boolean;
};

function buildDateFilterParams(
  dateFilterField: JiraPreviewDateFilterField,
  startDate: string,
  endDate: string,
): Partial<JiraPreviewParams> {
  if (dateFilterField === "sprint") {
    return {
      ...(startDate ? { startDate__gte: startDate } : {}),
      ...(endDate ? { endDate__lte: endDate } : {}),
    };
  }

  if (dateFilterField === "updated_at") {
    return {
      ...(startDate ? { updated_at__gte: startDate } : {}),
      ...(endDate ? { updated_at__lte: endDate } : {}),
    };
  }

  return {
    ...(startDate ? { created__gte: startDate } : {}),
    ...(endDate ? { created__lte: endDate } : {}),
  };
}

function resolveJiraProjectValue(project: JiraOverviewProject) {
  const rawValue =
    project.id ?? project.project_key ?? project.key ?? project.project ?? null;

  if (rawValue === null || rawValue === undefined) return "";

  return String(rawValue);
}

function resolveJiraProjectLabel(
  project: JiraOverviewProject,
  fallbackValue: string,
) {
  return (
    project.project ??
    project.name ??
    project.project_key ??
    project.key ??
    fallbackValue
  );
}

export function JiraPreview({
  idPrefix,
  previewSection,
  itemsLabel,
  emptyStateMessage,
  loadErrorMessage,
  exportFileNamePrefix,
  exportSuccessMessage = "Jira preview exported successfully.",
  dateFilterField,
  showDateFilters = true,
}: JiraPreviewProps) {
  // Queries e actions da tela.
  const { data: overviewData, isPending: isProjectListPending } =
    useJiraOverviewQuery();
  const previewExportMutation = useJiraExportMutation();

  // Opções do select de projetos no formato padrão do FormSelect.
  const projectOptions = useMemo(() => {
    const projects = Array.isArray(overviewData?.projects)
      ? overviewData.projects
      : [];

    return projects
      .map((project) => {
        const value = resolveJiraProjectValue(project);
        if (!value) return null;

        return {
          value,
          label: resolveJiraProjectLabel(project, value),
        };
      })
      .filter(Boolean) as { value: string; label: string }[];
  }, [overviewData?.projects]);

  // Monta o payload da query de preview baseado nos estados compartilhados do PreviewScreen.
  const buildPreviewParams = useCallback(
    ({
      page,
      rowsPerPage,
      selectedSourceId,
      search,
      ordering,
      dateFilters,
    }: PreviewScreenBuildParamsInput): JiraPreviewParams => ({
      page,
      page_size: rowsPerPage,
      ...(selectedSourceId ? { project: selectedSourceId } : {}),
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

  const requestExportPayload = useCallback(
    () => previewExportMutation.mutateAsync(),
    [previewExportMutation],
  );

  return (
    <PreviewScreen
      idPrefix={idPrefix}
      previewSection={previewSection}
      sourceFilterLabel="Project"
      allSourcesOptionLabel="All projects"
      sourceOptions={projectOptions}
      isSourceListPending={isProjectListPending}
      itemsLabel={itemsLabel}
      emptyStateMessage={emptyStateMessage}
      loadErrorMessage={loadErrorMessage}
      exportFileNamePrefix={exportFileNamePrefix}
      exportSuccessMessage={exportSuccessMessage}
      showDateFilters={showDateFilters}
      useDateRangeBySourceQuery={useJiraDateRangeByProjectQuery}
      usePreviewBySourceQuery={useJiraPreviewQuery}
      buildPreviewParams={buildPreviewParams}
      requestExportPayload={requestExportPayload}
      isExportPending={previewExportMutation.isPending}
    />
  );
}

export type { JiraPreviewDateFilterField, JiraPreviewProps };

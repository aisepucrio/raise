import { useCallback, useMemo } from "react";

import {
  OverviewScreen,
  type OverviewScreenBuildGraphParamsInput,
  type OverviewScreenBuildParamsInput,
} from "@/components/overview-screen";
import type {
  JiraGraphParams,
  JiraOverviewParams,
  JiraOverviewResponse,
} from "@/data/modules/jira/jiraService";
import {
  useJiraDateRangeByProjectQuery,
  useJiraGraphQuery,
  useJiraOverviewQuery,
} from "@/data/modules/jira/jiraQueries";
import {
  buildOverviewMetricCardItems,
  type OverviewMetricCardConfig,
} from "@/sources/shared/OverviewShared";
import { buildSelectOptions } from "@/sources/shared/AllShared";

// Configuração dos cards exibidos quando não há projeto selecionado.
// A ordem aqui é a ordem visual da coluna lateral no modo "All projects".
const ALL_PROJECTS_CARD_CONFIG: readonly OverviewMetricCardConfig<JiraOverviewResponse>[] =
  [
    { title: "Issues", getValue: (data) => data?.issues_count },
    { title: "Projects", getValue: (data) => data?.projects_count },
    { title: "Users", getValue: (data) => data?.users_count },
  ];

// Configuração dos cards exibidos para um projeto específico.
// Mantém apenas métricas relevantes ao escopo de um projeto.
const PROJECT_CARD_CONFIG: readonly OverviewMetricCardConfig<JiraOverviewResponse>[] =
  [
    { title: "Issues", getValue: (data) => data?.issues_count },
    { title: "Comments", getValue: (data) => data?.comments_count },
    { title: "Sprints", getValue: (data) => data?.sprints_count },
    { title: "Users", getValue: (data) => data?.users_count },
  ];

export default function JiraOverview() {
  // Query base usada para popular o select (lista completa de projetos).
  const projectCatalogQuery = useJiraOverviewQuery();

  // Dados derivados prontos para renderização no select.
  const projectOptions = useMemo(
    () =>
      buildSelectOptions(projectCatalogQuery.data?.projects, {
        getValue: (project) => project.name,
        getLabel: (project) => project.name,
      }),
    [projectCatalogQuery.data?.projects],
  );

  // Monta o payload da query de overview baseado nos filtros compartilhados do `OverviewScreen`.
  const buildOverviewParams = useCallback(
    ({
      selectedSourceId,
      startDate,
      endDate,
    }: OverviewScreenBuildParamsInput): JiraOverviewParams | undefined =>
      selectedSourceId || startDate || endDate
        ? {
            ...(selectedSourceId ? { project_id: selectedSourceId } : {}),
            ...(startDate ? { start_date: startDate } : {}),
            ...(endDate ? { end_date: endDate } : {}),
          }
        : undefined,
    [],
  );

  // Monta o payload da query de gráfico baseado nos filtros compartilhados do `OverviewScreen`.
  const buildGraphParams = useCallback(
    ({
      selectedSourceId,
      startDate,
      endDate,
      interval,
    }: OverviewScreenBuildGraphParamsInput): JiraGraphParams => ({
      interval,
      ...(selectedSourceId ? { project_id: selectedSourceId } : {}),
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    }),
    [],
  );

  // Converte a configuração declarativa dos cards nos itens consumidos pelo `InfoBoxGrid`.
  const buildInfoBoxItems = useCallback(
    ({
      overviewData,
      isOverviewPending,
      isSourceScoped,
    }: {
      overviewData: JiraOverviewResponse | undefined;
      isOverviewPending: boolean;
      isSourceScoped: boolean;
    }) => {
      const activeCardConfig = isSourceScoped
        ? PROJECT_CARD_CONFIG
        : ALL_PROJECTS_CARD_CONFIG;

      return buildOverviewMetricCardItems(
        overviewData,
        isOverviewPending,
        activeCardConfig,
      );
    },
    [],
  );

  return (
    <OverviewScreen
      idPrefix="jira-overview"
      sourceFilterLabel="Project"
      allSourcesOptionLabel="All projects"
      sourceOptions={projectOptions}
      isSourceListPending={projectCatalogQuery.isPending}
      chartTitle="Jira Activity"
      chartErrorMessage="Failed to load the Jira chart."
      chartEmptyMessage="No series found for the selected filters."
      useOverviewQuery={useJiraOverviewQuery}
      useGraphQuery={useJiraGraphQuery}
      useDateRangeBySourceQuery={useJiraDateRangeByProjectQuery}
      buildOverviewParams={buildOverviewParams}
      buildGraphParams={buildGraphParams}
      buildInfoBoxItems={buildInfoBoxItems}
    />
  );
}

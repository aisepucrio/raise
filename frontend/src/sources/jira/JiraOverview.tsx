import { useMemo, useState } from "react";

import {
  OverviewChartSection,
  OverviewFilters,
  OverviewLayout,
  OverviewStatsSection,
} from "@/components/overview";
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
  buildOverviewEndpointParams,
  buildOverviewGraphEndpointParams,
  buildScopedOverviewMetricCardItems,
  resolveOverviewGraphPresentation,
  resolveOverviewGraphInterval,
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
  // Filtros controlados pela própria tela (não ficam na URL).
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Catálogo usado apenas para montar o select de projetos.
  const projectCatalogQuery = useJiraOverviewQuery();

  // Adapta payload da API para o formato padrão de opções da UI.
  const projectOptions = useMemo(
    () =>
      buildSelectOptions(projectCatalogQuery.data?.projects, {
        getValue: (project) => project.name,
        getLabel: (project) => project.name,
      }),
    [projectCatalogQuery.data?.projects],
  );

  // Params da query de overview (cards).
  const overviewParams = useMemo(
    () =>
      buildOverviewEndpointParams<JiraOverviewParams>(
        {
          selectedSourceId: selectedProjectId,
          startDate,
          endDate,
        },
        "project_id",
      ),
    [selectedProjectId, startDate, endDate],
  );
  const overviewQuery = useJiraOverviewQuery(overviewParams);

  // Série temporal usa os mesmos filtros + intervalo derivado do range.
  const graphParams = useMemo(
    () =>
      buildOverviewGraphEndpointParams<JiraGraphParams>(
        {
          selectedSourceId: selectedProjectId,
          startDate,
          endDate,
          interval: resolveOverviewGraphInterval(startDate, endDate),
        },
        "project_id",
      ),
    [selectedProjectId, startDate, endDate],
  );
  const graphQuery = useJiraGraphQuery(graphParams);

  // O próprio hook já:
  // - normaliza string vazia para `undefined`
  // - só habilita a query quando há `project_id`
  const dateRangeQuery = useJiraDateRangeByProjectQuery(selectedProjectId);

  const { graphSeries, graphErrorMessage } = resolveOverviewGraphPresentation(
    graphQuery,
    "Failed to load the Jira chart.",
  );

  // Modo scoped = um projeto específico selecionado.
  const isProjectScoped = Boolean(selectedProjectId);
  const infoBoxItems = buildScopedOverviewMetricCardItems({
    overviewData: overviewQuery.data,
    isOverviewPending: overviewQuery.isPending,
    isSourceScoped: isProjectScoped,
    allScopeConfig: ALL_PROJECTS_CARD_CONFIG,
    sourceScopeConfig: PROJECT_CARD_CONFIG,
  });

  return (
    <OverviewLayout
      filters={
        <OverviewFilters
          idPrefix="jira-overview"
          sourceFilterLabel="Project"
          allSourcesOptionLabel="All projects"
          sourceOptions={projectOptions}
          selectedSourceId={selectedProjectId}
          onSourceChange={setSelectedProjectId}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          isSourceListPending={projectCatalogQuery.isPending}
          dateRange={dateRangeQuery.data}
        />
      }
      chart={
        <OverviewChartSection
          title="Jira Activity"
          data={graphSeries}
          loading={graphQuery.isPending}
          error={graphErrorMessage}
          emptyMessage="No series found for the selected filters."
        />
      }
      stats={<OverviewStatsSection items={infoBoxItems} />}
    />
  );
}

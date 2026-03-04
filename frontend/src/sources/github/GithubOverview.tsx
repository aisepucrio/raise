import { useMemo, useState } from "react";

import {
  OverviewChartSection,
  OverviewFilters,
  OverviewLayout,
  OverviewStatsSection,
} from "@/components/overview";
import {
  useGithubDateRangeByRepositoryQuery,
  useGithubGraphQuery,
  useGithubOverviewQuery,
  type GithubGraphParams,
  type GithubOverviewParams,
  type GithubOverviewResponse,
} from "@/data";
import {
  buildOverviewEndpointParams,
  buildOverviewGraphEndpointParams,
  buildScopedOverviewMetricCardItems,
  resolveOverviewGraphPresentation,
  resolveOverviewGraphInterval,
  type OverviewMetricCardConfig,
} from "@/sources/shared/OverviewShared";
import { buildSelectOptions } from "@/sources/shared/AllShared";

// Configuração dos cards exibidos quando não há repositório selecionado.
// A ordem aqui é a ordem visual da coluna lateral no modo "All repositories".
const ALL_REPOSITORIES_CARD_CONFIG: readonly OverviewMetricCardConfig<GithubOverviewResponse>[] =
  [
    { title: "Repositories", getValue: (data) => data?.repositories_count },
    { title: "Issues", getValue: (data) => data?.issues_count },
    { title: "Pull Requests", getValue: (data) => data?.pull_requests_count },
    { title: "Commits", getValue: (data) => data?.commits_count },
    { title: "Users", getValue: (data) => data?.users_count },
  ];

// Configuração dos cards exibidos para um repositório específico.
// Mantém apenas métricas relevantes ao escopo de um repo (inclui forks/stars).
const REPOSITORY_CARD_CONFIG: readonly OverviewMetricCardConfig<GithubOverviewResponse>[] =
  [
    { title: "Commits", getValue: (data) => data?.commits_count },
    { title: "Issues", getValue: (data) => data?.issues_count },
    { title: "Pull Requests", getValue: (data) => data?.pull_requests_count },
    { title: "Users", getValue: (data) => data?.users_count },
    { title: "Forks", getValue: (data) => data?.forks_count },
    { title: "Stars", getValue: (data) => data?.stars_count },
  ];

export default function GithubOverview() {
  // Filtros controlados pela própria tela (não ficam na URL).
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Catálogo usado apenas para montar o select de repositórios.
  const repositoryCatalogQuery = useGithubOverviewQuery();

  // Adapta payload da API para o formato padrão de opções da UI.
  const repositoryOptions = useMemo(
    () =>
      buildSelectOptions(repositoryCatalogQuery.data?.repositories, {
        getValue: (repository) => repository.id,
        getLabel: (repository) => repository.repository,
      }),
    [repositoryCatalogQuery.data?.repositories],
  );

  // Params da query de overview (cards).
  const overviewParams = useMemo(
    () =>
      buildOverviewEndpointParams<GithubOverviewParams>(
        {
          selectedSourceId: selectedRepositoryId,
          startDate,
          endDate,
        },
        "repository_id",
      ),
    [selectedRepositoryId, startDate, endDate],
  );
  const overviewQuery = useGithubOverviewQuery(overviewParams);

  // Série temporal usa os mesmos filtros + intervalo derivado do range.
  const graphParams = useMemo(
    () =>
      buildOverviewGraphEndpointParams<GithubGraphParams>(
        {
          selectedSourceId: selectedRepositoryId,
          startDate,
          endDate,
          interval: resolveOverviewGraphInterval(startDate, endDate),
        },
        "repository_id",
      ),
    [selectedRepositoryId, startDate, endDate],
  );
  const graphQuery = useGithubGraphQuery(graphParams);

  // O próprio hook já:
  // - normaliza string vazia para `undefined`
  // - só habilita a query quando há `repository_id`
  const dateRangeQuery = useGithubDateRangeByRepositoryQuery(
    selectedRepositoryId,
  );

  const { graphSeries, graphErrorMessage } = resolveOverviewGraphPresentation(
    graphQuery,
    "Failed to load the GitHub chart.",
  );

  // Modo scoped = um repositório específico selecionado.
  const isRepositoryScoped = Boolean(selectedRepositoryId);
  const infoBoxItems = buildScopedOverviewMetricCardItems({
    overviewData: overviewQuery.data,
    isOverviewPending: overviewQuery.isPending,
    isSourceScoped: isRepositoryScoped,
    allScopeConfig: ALL_REPOSITORIES_CARD_CONFIG,
    sourceScopeConfig: REPOSITORY_CARD_CONFIG,
  });

  return (
    <OverviewLayout
      filters={
        <OverviewFilters
          idPrefix="github-overview"
          sourceFilterLabel="Repository"
          allSourcesOptionLabel="All repositories"
          sourceOptions={repositoryOptions}
          selectedSourceId={selectedRepositoryId}
          onSourceChange={setSelectedRepositoryId}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          isSourceListPending={repositoryCatalogQuery.isPending}
          dateRange={dateRangeQuery.data}
        />
      }
      chart={
        <OverviewChartSection
          title="GitHub Activity"
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

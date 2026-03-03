import { useCallback, useMemo } from "react";

import {
  OverviewScreen,
  type OverviewScreenBuildGraphParamsInput,
  type OverviewScreenBuildParamsInput,
} from "@/components/overview-screen";
import type {
  GithubGraphParams,
  GithubOverviewParams,
  GithubOverviewResponse,
} from "@/data/modules/github/githubService";
import {
  buildOverviewMetricCardItems,
  type OverviewMetricCardConfig,
} from "@/sources/shared/OverviewShared";
import { buildSelectOptions } from "@/sources/shared/AllShared";
import {
  useGithubDateRangeByRepositoryQuery,
  useGithubGraphQuery,
  useGithubOverviewQuery,
} from "@/data/modules/github/githubQueries";

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
  // Query base usada para popular o select (lista completa de repositórios).
  const repositoryCatalogQuery = useGithubOverviewQuery();

  // Dados derivados prontos para renderização no select.
  const repositoryOptions = useMemo(
    () =>
      buildSelectOptions(repositoryCatalogQuery.data?.repositories, {
        getValue: (repository) => repository.id,
        getLabel: (repository) => repository.repository,
      }),
    [repositoryCatalogQuery.data?.repositories],
  );

  // Monta o payload da query de overview baseado nos filtros compartilhados do `OverviewScreen`.
  const buildOverviewParams = useCallback(
    ({
      selectedSourceId,
      startDate,
      endDate,
    }: OverviewScreenBuildParamsInput): GithubOverviewParams | undefined =>
      selectedSourceId || startDate || endDate
        ? {
            ...(selectedSourceId ? { repository_id: selectedSourceId } : {}),
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
    }: OverviewScreenBuildGraphParamsInput): GithubGraphParams => ({
      interval,
      ...(selectedSourceId ? { repository_id: selectedSourceId } : {}),
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
      overviewData: GithubOverviewResponse | undefined;
      isOverviewPending: boolean;
      isSourceScoped: boolean;
    }) => {
      const activeCardConfig = isSourceScoped
        ? REPOSITORY_CARD_CONFIG
        : ALL_REPOSITORIES_CARD_CONFIG;

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
      idPrefix="github-overview"
      sourceFilterLabel="Repository"
      allSourcesOptionLabel="All repositories"
      sourceOptions={repositoryOptions}
      isSourceListPending={repositoryCatalogQuery.isPending}
      chartTitle="GitHub Activity"
      chartErrorMessage="Failed to load the GitHub chart."
      chartEmptyMessage="No series found for the selected filters."
      useOverviewQuery={useGithubOverviewQuery}
      useGraphQuery={useGithubGraphQuery}
      useDateRangeBySourceQuery={useGithubDateRangeByRepositoryQuery}
      buildOverviewParams={buildOverviewParams}
      buildGraphParams={buildGraphParams}
      buildInfoBoxItems={buildInfoBoxItems}
    />
  );
}

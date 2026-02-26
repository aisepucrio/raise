import { useEffect, useState } from "react";

import { FormDateSelector, FormSelect } from "@/components/form";
import { InfoBoxGrid } from "@/components/info-box";
import { LineChart } from "@/components/line-chart";
import { getQueryErrorMessage } from "@/data";
import type { GithubOverviewResponse } from "@/data/modules/github/githubService";
import {
  buildOverviewMetricCardItems,
  buildOverviewSelectOptions,
  buildLineSeriesFromTimeSeries,
  getOverviewSidebarGridRowsStyle,
  type OverviewMetricCardConfig,
  resolveOverviewGraphInterval,
  toDateInputValue,
} from "@/sources/shared/OverviewShared";
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

// Regra de cor específica do módulo GitHub (métricas disponíveis neste source).
function getGithubOverviewChartSeriesColor(serie: { id: string }) {
  const key = serie.id.toLowerCase().replace(/[\s-]+/g, "_");

  if (key.includes("commit")) return "var(--color-status-finished-color)";
  if (key.includes("issue")) return "var(--color-status-in-progress-color)";
  if (key.includes("pull_request")) return "var(--color-status-in-queue-color)";
  if (key.includes("user")) return "var(--theme-secondary)";
  if (key.includes("comment")) return "var(--theme-secondary-70)";
  if (key.includes("fork")) return "var(--theme-secondary-90)";
  if (key.includes("star")) return "var(--color-status-failure-color)";

  return "var(--theme-secondary)";
}

export default function GithubOverview() {
  // Estado local dos filtros da tela.
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Validação simples para evitar requests com intervalo invertido.
  const dateOrderError =
    startDate && endDate && startDate > endDate
      ? "Start date must be less than or equal to end date."
      : undefined;

  // Query base usada para popular o select (lista completa de repositórios).
  const repositoryCatalogQuery = useGithubOverviewQuery();

  // Params compartilhados pelos endpoints de overview (cards) com filtros opcionais.
  const overviewParams =
    selectedRepositoryId || startDate || endDate
      ? {
          ...(selectedRepositoryId
            ? { repository_id: selectedRepositoryId }
            : {}),
          ...(startDate ? { start_date: startDate } : {}),
          ...(endDate ? { end_date: endDate } : {}),
        }
      : undefined;

  // Overview filtrado: alimenta cards e metadados do painel lateral.
  const overviewQuery = useGithubOverviewQuery(overviewParams, {
    enabled: !dateOrderError,
  });

  // Série temporal do gráfico (usa o mesmo conjunto de filtros).
  const graphQuery = useGithubGraphQuery(
    {
      interval: resolveOverviewGraphInterval(startDate, endDate),
      ...(selectedRepositoryId ? { repository_id: selectedRepositoryId } : {}),
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    },
    { enabled: !dateOrderError },
  );

  // Faixa de datas válida por repositório (habilita somente quando há item selecionado).
  const dateRangeQuery = useGithubDateRangeByRepositoryQuery(
    selectedRepositoryId || undefined,
  );

  // As queries já ficam tipadas pelo service; aqui só reaproveitamos os payloads.
  const catalogData = repositoryCatalogQuery.data;
  const overviewData = overviewQuery.data;
  const graphData = graphQuery.data;

  // Dados derivados prontos para renderização no select.
  const repositoryOptions = buildOverviewSelectOptions(
    (catalogData ?? overviewData)?.repositories,
    {
      getValue: (repository) => repository.id,
      getLabel: (repository) => repository.repository,
    },
  );
  const graphSeries = buildLineSeriesFromTimeSeries(graphData?.time_series);
  const graphErrorMessage = graphQuery.isError
    ? getQueryErrorMessage(graphQuery.error, "Failed to load the GitHub chart.")
    : null;

  const minDate = toDateInputValue(dateRangeQuery.data?.minDate);
  const maxDate = toDateInputValue(dateRangeQuery.data?.maxDate);

  // Se o repositório muda, remove datas que saíram do range permitido.
  useEffect(() => {
    if (!selectedRepositoryId) return;

    if (minDate && startDate && startDate < minDate) setStartDate("");
    if (maxDate && startDate && startDate > maxDate) setStartDate("");
    if (minDate && endDate && endDate < minDate) setEndDate("");
    if (maxDate && endDate && endDate > maxDate) setEndDate("");
  }, [selectedRepositoryId, minDate, maxDate, startDate, endDate]);

  // Está no modo all?
  const isRepositoryScoped = Boolean(selectedRepositoryId);

  // Muda a renderização de infobox de acordo com o modo
  const activeCardConfig = isRepositoryScoped
    ? REPOSITORY_CARD_CONFIG
    : ALL_REPOSITORIES_CARD_CONFIG;

  // Converte a configuração declarativa acima nos itens consumidos pelo `InfoBoxGrid`.
  const infoBoxItems = buildOverviewMetricCardItems(
    overviewData,
    overviewQuery.isPending,
    activeCardConfig,
  );
  const sidebarGridRowsStyle = getOverviewSidebarGridRowsStyle(
    infoBoxItems.length,
  );

  return (
    // Layout principal 80/20 em desktop.
    <section className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,4fr)_minmax(0,1fr)]">
      {/* Coluna esquerda: filtros + gráfico */}
      <section className="flex min-h-168 min-w-0 flex-col rounded-xl border-2 border-(--color-sidebar-border) bg-(--color-app-bg) xl:min-h-0 xl:h-full xl:max-h-full">
        {/* Linha de filtros (repositório + intervalo de datas) */}
        <div className="grid gap-3 border-b-2 border-(--color-sidebar-border) p-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr]">
          <FormSelect
            id="github-overview-repository"
            label="Repository"
            value={selectedRepositoryId}
            onChange={(event) => setSelectedRepositoryId(event.target.value)}
            wrapperClassName="min-w-0"
            disabled={
              repositoryCatalogQuery.isPending && repositoryOptions.length === 0
            }
          >
            <option value="">All repositories</option>
            {repositoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>

          <FormDateSelector
            id="github-overview-start-date"
            label="Start date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            min={minDate}
            max={endDate || maxDate}
            wrapperClassName="min-w-0"
            error={dateOrderError}
          />

          <FormDateSelector
            id="github-overview-end-date"
            label="End date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            min={startDate || minDate}
            max={maxDate}
            wrapperClassName="min-w-0"
            error={dateOrderError}
          />
        </div>

        {/* Área restante da coluna esquerda dedicada ao gráfico */}
        <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-3">
          <LineChart
            title="GitHub Activity"
            data={dateOrderError ? [] : graphSeries}
            loading={!dateOrderError && graphQuery.isPending}
            error={graphErrorMessage}
            yLabel="Items"
            height={430}
            emptyMessage={
              dateOrderError ?? "No series found for the selected filters."
            }
            colors={getGithubOverviewChartSeriesColor}
          />
        </div>
      </section>

      {/* Coluna direita: cards de estatísticas */}
      <aside className="flex min-h-168 min-w-0 flex-col rounded-xl border-2 border-(--color-sidebar-border) bg-(--color-app-bg) xl:min-h-0 xl:h-full xl:max-h-full">
        {/* Grid vertical com métricas específicas do modo atual (all vs repository). */}
        <div className="min-h-0 flex-1 overflow-hidden p-4">
          <InfoBoxGrid
            items={infoBoxItems}
            style={sidebarGridRowsStyle}
            className="h-full min-h-0 grid-cols-1 p-0 sm:grid-cols-1 xl:grid-cols-1 [&_article]:min-h-0"
          />
        </div>
      </aside>
    </section>
  );
}

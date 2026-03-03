import { useMemo, useState } from "react";

import { FormSelect } from "@/components/form";
import { InfoBoxGrid, type InfoBoxGridItem } from "@/components/info-box";
import { LineChart } from "@/components/line-chart";
import { StartEndDateFilter } from "@/components/start-end-datefilter";
import { getQueryErrorMessage } from "@/data";
import {
  buildLineSeriesFromTimeSeries,
  getOverviewSidebarGridRowsStyle,
  resolveOverviewGraphInterval,
  type LabeledTimeSeriesPayload,
  type OverviewGraphInterval,
} from "@/sources/shared/OverviewShared";

type OverviewScreenSourceOption = {
  value: string;
  label: string;
};

type OverviewScreenDateRange = {
  minDate?: string;
  maxDate?: string;
};

type OverviewScreenBuildParamsInput = {
  selectedSourceId: string;
  startDate: string;
  endDate: string;
};

type OverviewScreenBuildGraphParamsInput = OverviewScreenBuildParamsInput & {
  interval: OverviewGraphInterval;
};

const OVERVIEW_CHART_COLORS = [
  "var(--color-indigo)",
  "var(--color-teal)",
  "var(--color-amber)",
  "var(--color-secondary)",
  "var(--color-rose)",
  "var(--color-secondary-strong)",
  "var(--color-secondary-muted)",
];

type OverviewScreenProps<
  TOverviewData,
  TOverviewParams,
  TGraphParams,
  TGraphData,
> = {
  idPrefix: string;
  sourceFilterLabel: string;
  allSourcesOptionLabel: string;
  sourceOptions: OverviewScreenSourceOption[];
  isSourceListPending?: boolean;
  chartTitle: string;
  chartErrorMessage: string;
  chartEmptyMessage: string;
  useOverviewQuery: (
    params?: TOverviewParams,
    options?: { enabled?: boolean },
  ) => {
    data?: TOverviewData;
    isPending: boolean;
  };
  useGraphQuery: (
    params: TGraphParams,
    options?: { enabled?: boolean },
  ) => {
    data?: TGraphData;
    isPending: boolean;
    isError: boolean;
    error: unknown;
  };
  useDateRangeBySourceQuery: (
    sourceId?: string,
    options?: { enabled?: boolean },
  ) => {
    data?: OverviewScreenDateRange;
  };
  buildOverviewParams: (
    input: OverviewScreenBuildParamsInput,
  ) => TOverviewParams | undefined;
  buildGraphParams: (
    input: OverviewScreenBuildGraphParamsInput,
  ) => TGraphParams;
  buildInfoBoxItems: (input: {
    overviewData: TOverviewData | undefined;
    isOverviewPending: boolean;
    isSourceScoped: boolean;
  }) => InfoBoxGridItem[];
};

export function OverviewScreen<
  TOverviewData,
  TOverviewParams,
  TGraphParams,
  TGraphData,
>({
  idPrefix,
  sourceFilterLabel,
  allSourcesOptionLabel,
  sourceOptions,
  isSourceListPending = false,
  chartTitle,
  chartErrorMessage,
  chartEmptyMessage,
  useOverviewQuery,
  useGraphQuery,
  useDateRangeBySourceQuery,
  buildOverviewParams,
  buildGraphParams,
  buildInfoBoxItems,
}: OverviewScreenProps<TOverviewData, TOverviewParams, TGraphParams, TGraphData>) {
  // Estado local dos filtros da tela.
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Params compartilhados pelos endpoints de overview (cards) com filtros opcionais.
  const overviewParams = useMemo(
    () => buildOverviewParams({ selectedSourceId, startDate, endDate }),
    [buildOverviewParams, selectedSourceId, startDate, endDate],
  );

  // Overview filtrado: alimenta cards e metadados do painel lateral.
  const overviewQuery = useOverviewQuery(overviewParams);

  // Série temporal do gráfico (usa o mesmo conjunto de filtros).
  const graphParams = useMemo(
    () =>
      buildGraphParams({
        selectedSourceId,
        startDate,
        endDate,
        interval: resolveOverviewGraphInterval(startDate, endDate),
      }),
    [buildGraphParams, selectedSourceId, startDate, endDate],
  );
  const graphQuery = useGraphQuery(graphParams);

  // Faixa de datas válida por item selecionado (repositório/projeto).
  const dateRangeQuery = useDateRangeBySourceQuery(selectedSourceId || undefined, {
    enabled: Boolean(selectedSourceId),
  });

  const graphTimeSeries = (
    graphQuery.data as
      | { time_series?: LabeledTimeSeriesPayload | null }
      | undefined
  )?.time_series;
  const graphSeries = buildLineSeriesFromTimeSeries(graphTimeSeries);
  const graphErrorMessage = graphQuery.isError
    ? getQueryErrorMessage(graphQuery.error, chartErrorMessage)
    : null;

  // Está no modo all?
  const isSourceScoped = Boolean(selectedSourceId);

  // Converte configuração declarativa do source nos itens do `InfoBoxGrid`.
  const infoBoxItems = buildInfoBoxItems({
    overviewData: overviewQuery.data,
    isOverviewPending: overviewQuery.isPending,
    isSourceScoped,
  });
  const sidebarGridRowsStyle = getOverviewSidebarGridRowsStyle(
    infoBoxItems.length,
  );

  return (
    // Layout principal 80/20 em desktop.
    <section className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,4fr)_minmax(0,1fr)]">
      {/* Coluna esquerda: filtros + gráfico */}
      <section className="flex min-h-168 min-w-0 flex-col rounded-xl border-2 border-(--color-secondary-soft) bg-(--color-primary) xl:min-h-0 xl:h-full xl:max-h-full">
        {/* Linha de filtros (item + intervalo de datas) */}
        <div className="grid gap-3 border-b-2 border-(--color-secondary-soft) p-4 md:grid-cols-2 xl:grid-cols-[2fr_minmax(0,2fr)]">
          <FormSelect
            id={`${idPrefix}-source`}
            label={sourceFilterLabel}
            value={selectedSourceId}
            onChange={(event) => setSelectedSourceId(event.target.value)}
            wrapperClassName="min-w-0"
            disabled={isSourceListPending && sourceOptions.length === 0}
          >
            <option value="">{allSourcesOptionLabel}</option>
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>

          <StartEndDateFilter
            idPrefix={idPrefix}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            startLabel="Start date"
            endLabel="End date"
            dateRange={selectedSourceId ? dateRangeQuery.data : undefined}
          />
        </div>

        {/* Área restante da coluna esquerda dedicada ao gráfico */}
        <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-3">
          <LineChart
            title={chartTitle}
            data={graphSeries}
            loading={graphQuery.isPending}
            error={graphErrorMessage}
            yLabel="Items"
            height={430}
            emptyMessage={chartEmptyMessage}
            colors={OVERVIEW_CHART_COLORS}
          />
        </div>
      </section>

      {/* Coluna direita: cards de estatísticas */}
      <aside className="flex min-h-168 min-w-0 flex-col rounded-xl border-2 border-(--color-secondary-soft) bg-(--color-primary) xl:min-h-0 xl:h-full xl:max-h-full">
        {/* Grid vertical com métricas específicas do modo atual (all vs item). */}
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

export type {
  OverviewScreenBuildGraphParamsInput,
  OverviewScreenBuildParamsInput,
  OverviewScreenDateRange,
  OverviewScreenProps,
  OverviewScreenSourceOption,
};

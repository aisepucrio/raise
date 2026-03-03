import type { CSSProperties } from "react";
import type { LineSeries } from "@/components/line-chart";

// Intervalos suportados pelos endpoints de gráfico de overview.
export type OverviewGraphInterval = "day" | "month" | "year";

// Formato de série temporal padronizado que vários endpoints de overview tendem a expor.
export type LabeledTimeSeriesPayload = {
  labels?: Array<string | number>;
  [key: string]: unknown;
};

// Valor bruto de uma série temporal vindo da API (normalmente número, mas pode vir string/null).
type TimeSeriesRawPoint = string | number | null;
type TimeSeriesEntry = [seriesKey: string, values: TimeSeriesRawPoint[]];

type BuildLineSeriesFromTimeSeriesOptions = {
  // Permite customizar o texto exibido na legenda.
  labelFormatter?: (seriesKey: string) => string;
};

// Configuração declarativa de card:
// - `title`: texto visível no InfoBox
// - `getValue`: como buscar a métrica no payload do endpoint
//
// Exemplo de uso:
// `{ title: "Issues", getValue: (data) => data?.issues_count }`
export type OverviewMetricCardConfig<TData> = {
  title: string;
  getValue: (data: TData | undefined) => number | undefined;
};

// Escolhe um intervalo de agregação para o gráfico com base no range selecionado.
export function resolveOverviewGraphInterval(
  startDate: string,
  endDate: string,
): OverviewGraphInterval {
  if (!startDate || !endDate) return "month";

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();

  if (!Number.isFinite(diffMs) || diffMs <= 0) return "day";

  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays > 730) return "year";
  if (diffDays > 120) return "month";
  return "day";
}

// Formata números exibidos em cards de overview e mantém placeholder no loading.
export function formatOverviewStatValue(
  value?: number,
  isLoading?: boolean,
  locale = "en-US",
) {
  if (value === undefined) return isLoading ? "..." : "-";

  return new Intl.NumberFormat(locale).format(value);
}

// Converte uma configuração declarativa de métricas em itens prontos para o `InfoBoxGrid`.
//
// O que entra:
// - `data`: payload bruto do endpoint de overview (ex.: resposta do GitHub/Jira)
// - `isLoading`: estado da query para exibir placeholder ("...") enquanto carrega
// - `config`: lista ordenada de cards com:
//   - `title` (texto visível do card)
//   - `getValue(data)` (como ler a métrica dentro do payload)
//
// O que sai:
// - array no formato esperado pelo `InfoBoxGrid`, com `{ title, number }`
// - `number` já vem formatado (ex.: `12,345`) e com fallback (`...` / `-`)
//
// Por que existe:
// - evita repetir, em cada source, blocos longos de `title + formatOverviewStatValue(...)`
// - mantém a regra de negócio visível e simples (a ordem dos cards continua no `config`)
// - permite reaproveitar a mesma transformação em módulos diferentes de overview
export function buildOverviewMetricCardItems<TData>(
  data: TData | undefined,
  isLoading: boolean,
  config: readonly OverviewMetricCardConfig<TData>[],
  locale = "en-US",
) {
  return config.map((item) => ({
    title: item.title,
    number: formatOverviewStatValue(item.getValue(data), isLoading, locale),
  }));
}

// Adapta `{ labels, serieA: [], serieB: [] }` para o formato do `LineChart`.
export function buildLineSeriesFromTimeSeries(
  timeSeries?: LabeledTimeSeriesPayload | null,
  options?: BuildLineSeriesFromTimeSeriesOptions,
): LineSeries[] {
  if (!timeSeries || !Array.isArray(timeSeries.labels)) return [];

  const labels = timeSeries.labels.map(String);
  const labelFormatter = options?.labelFormatter ?? humanizeOverviewSeriesKey;

  return Object.entries(timeSeries)
    .filter(isTimeSeriesDataEntry)
    .map(([seriesKey, values]) => {
      const data = values
        .map((value, index) => {
          const x = labels[index];
          const y = Number(value);

          if (!x || !Number.isFinite(y)) return null;
          return { x, y };
        })
        .filter(Boolean) as LineSeries["data"];

      return {
        id: labelFormatter(seriesKey),
        data,
      } satisfies LineSeries;
    })
    .filter((series) => series.data.length > 0);
}

// Gera um `grid-template-rows` dinâmico para a sidebar de overview.
// Assim a coluna de cards ocupa a altura disponível sem ficar presa a casos hard-coded (4/5/6).
export function getOverviewSidebarGridRowsStyle(
  cardCount: number,
): CSSProperties {
  const safeCount =
    Number.isFinite(cardCount) && cardCount > 0 ? Math.floor(cardCount) : 1;

  return {
    gridTemplateRows: `repeat(${safeCount}, minmax(0, 1fr))`,
  };
}

// Converte chaves de série como `open_issues` para um formato mais legível como "Open Issues".
function humanizeOverviewSeriesKey(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Type guard para o TS entender que a entrada é uma série (e não `labels`).
function isTimeSeriesDataEntry(
  entry: [string, unknown],
): entry is TimeSeriesEntry {
  const [key, values] = entry;

  if (key === "labels") return false;
  if (!Array.isArray(values)) return false;

  return true;
}

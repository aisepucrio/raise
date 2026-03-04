import { LineChart, type LineSeries } from "@/components/line-chart";

const OVERVIEW_CHART_COLORS = [
  "var(--color-indigo)",
  "var(--color-teal)",
  "var(--color-amber)",
  "var(--color-secondary)",
  "var(--color-rose)",
  "var(--color-secondary-strong)",
  "var(--color-secondary-muted)",
];

export type OverviewChartSectionProps = {
  title: string;
  data: LineSeries[];
  loading: boolean;
  error: string | null;
  emptyMessage: string;
};

// Bloco do gráfico principal com espaçamento e estados padrão.
export function OverviewChartSection({
  title,
  data,
  loading,
  error,
  emptyMessage,
}: OverviewChartSectionProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-3">
      <LineChart
        title={title}
        data={data}
        loading={loading}
        error={error}
        yLabel="Items"
        height={430}
        emptyMessage={emptyMessage}
        colors={OVERVIEW_CHART_COLORS}
      />
    </div>
  );
}

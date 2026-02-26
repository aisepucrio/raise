import { useEffect } from "react";
import { ResponsiveLine } from "@nivo/line";

import { Loader } from "@/components/loader";
import { toast } from "@/components/toast";

export type LinePoint = { x: string | number | Date; y: number };
export type LineSeries = { id: string; data: LinePoint[] };

export interface LineChartProps {
  title?: string;

  // O pai já entrega no formato do Nivo:
  // [{ id: "commits", data: [{x:"2026-01", y:10}, ...] }, ...]
  data: LineSeries[];

  loading?: boolean;
  error?: string | null;

  height?: number;
  yLabel?: string;

  emptyMessage?: string;

  // Opcional: cores fixas (por índice) ou função (por id)
  colors?: string[] | ((serie: { id: string }) => string);
}

// Fallback de cores (caso a série não tenha cor definida)
const DEFAULT_COLORS = [
  "var(--color-status-in-progress-color)",
  "var(--color-status-finished-color)",
  "var(--color-status-in-queue-color)",
  "var(--color-status-failure-color)",
  "var(--theme-secondary)",
];

const chartTheme = {
  background: "var(--color-app-bg)",
  text: {
    fill: "var(--color-app-fg)",
    fontSize: 12,
    fontFamily: "Montserrat, system-ui, sans-serif",
  },
  axis: {
    domain: {
      line: {
        stroke: "var(--theme-secondary-25)",
        strokeWidth: 1,
      },
    },
    ticks: {
      line: {
        stroke: "var(--theme-secondary-25)",
        strokeWidth: 1,
      },
      text: {
        fill: "var(--theme-secondary-70)",
        fontSize: 11,
      },
    },
    legend: {
      text: {
        fill: "var(--color-app-fg)",
        fontSize: 12,
        fontWeight: 600,
      },
    },
  },
  grid: {
    line: {
      stroke: "var(--theme-secondary-15)",
      strokeWidth: 1,
    },
  },
  crosshair: {
    line: {
      stroke: "var(--theme-secondary-50)",
      strokeWidth: 1,
      strokeOpacity: 0.5,
    },
  },
  legends: {
    text: {
      fill: "var(--theme-secondary-90)",
      fontSize: 12,
    },
  },
  tooltip: {
    container: {
      background: "var(--color-app-bg)",
      color: "var(--color-app-fg)",
      border: "1px solid var(--theme-border-subtle)",
      borderRadius: "12px",
      boxShadow:
        "0 8px 24px color-mix(in srgb, var(--theme-secondary) 12%, transparent)",
    },
  },
} as const;

export function LineChart({
  title = "Charts (Cumulative)",
  data,
  loading = false,
  error = null,
  height = 450,
  yLabel = "count",
  emptyMessage = "No data was available for the selected criteria.",
  colors = DEFAULT_COLORS,
}: LineChartProps) {
  // Checa se existe pelo menos 1 ponto em qualquer série
  const hasData =
    Array.isArray(data) &&
    data.length > 0 &&
    data.some((s) => Array.isArray(s.data) && s.data.length > 0);

  useEffect(() => {
    if (!error) return;

    toast.error(undefined, {
      description: error,
    });
  }, [error]);

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: Math.max(height, 160),
        }}
      >
        <Loader />
      </div>
    );
  }

  return (
    <section
      aria-label={title}
      style={{
        display: "grid",
        gap: 12,
        color: "var(--color-app-fg)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px 4px",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "var(--theme-secondary)",
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h3>
      </header>

      {error || !hasData ? (
        <div
          style={{
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px 16px",
          }}
        >
          <p
            role={error ? "alert" : "status"}
            style={{
              margin: 0,
              textAlign: "center",
              fontSize: 14,
              lineHeight: 1.4,
              color: error
                ? "var(--color-status-failure-color)"
                : "var(--theme-secondary-70)",
            }}
          >
            {error ?? emptyMessage}
          </p>
        </div>
      ) : (
        <div
          style={{
            height,
            minHeight: 240,
            padding: "0 8px 4px 16px",
          }}
        >
          <ResponsiveLine
            data={data}
            theme={chartTheme}
            margin={{ top: 50, right: 110, bottom: 90, left: 60 }}
            xScale={{ type: "point" }}
            yScale={{
              type: "linear",
              min: "auto",
              max: "auto",
              stacked: false,
            }}
            axisBottom={{
              tickRotation: -45,
              legendOffset: 36,
              legendPosition: "middle",
            }}
            axisLeft={{
              legend: yLabel,
              legendOffset: -40,
              legendPosition: "middle",
            }}
            enableSlices="x"
            useMesh
            curve="monotoneX"
            enablePoints={false}
            colors={colors}
            legends={[
              {
                anchor: "bottom",
                direction: "row",
                toggleSerie: true,
                justify: false,
                translateX: 90,
                translateY: 80,
                itemsSpacing: 8,
                itemDirection: "left-to-right",
                itemWidth: 200,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: "circle",
                symbolBorderColor: "var(--theme-secondary-25)",
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemBackground: "var(--theme-secondary-15)",
                      itemOpacity: 1,
                    },
                  },
                ],
              },
            ]}
          />
        </div>
      )}
    </section>
  );
}

export default LineChart;

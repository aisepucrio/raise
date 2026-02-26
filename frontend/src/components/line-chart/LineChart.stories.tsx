import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LineChart } from "./LineChart";
import type { LineSeries } from "./LineChart";

const monthlySeries: LineSeries[] = [
  {
    id: "Commits",
    data: [
      { x: "Jan", y: 14 },
      { x: "Fev", y: 25 },
      { x: "Mar", y: 39 },
      { x: "Abr", y: 46 },
      { x: "Mai", y: 60 },
      { x: "Jun", y: 68 },
    ],
  },
  {
    id: "PRs",
    data: [
      { x: "Jan", y: 6 },
      { x: "Fev", y: 12 },
      { x: "Mar", y: 16 },
      { x: "Abr", y: 24 },
      { x: "Mai", y: 33 },
      { x: "Jun", y: 41 },
    ],
  },
];

const queueSeries: LineSeries[] = [
  {
    id: "In Queue",
    data: [
      { x: "08:00", y: 4 },
      { x: "09:00", y: 7 },
      { x: "10:00", y: 9 },
      { x: "11:00", y: 3 },
      { x: "12:00", y: 5 },
      { x: "13:00", y: 2 },
    ],
  },
  {
    id: "Finished",
    data: [
      { x: "08:00", y: 1 },
      { x: "09:00", y: 5 },
      { x: "10:00", y: 8 },
      { x: "11:00", y: 12 },
      { x: "12:00", y: 16 },
      { x: "13:00", y: 21 },
    ],
  },
  {
    id: "Failures",
    data: [
      { x: "08:00", y: 0 },
      { x: "09:00", y: 1 },
      { x: "10:00", y: 1 },
      { x: "11:00", y: 2 },
      { x: "12:00", y: 1 },
      { x: "13:00", y: 3 },
    ],
  },
];

const storyWrapperClassName =
  "rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-4 text-(--color-app-fg)";

const meta = {
  title: "Components/LineChart",
  component: LineChart,
  tags: ["autodocs"],
  argTypes: {
    data: { control: false },
    colors: { control: false },
  },
  parameters: {
    docs: {
      story: {
        iframeHeight: 900,
      },
      description: {
        component:
          "Gráfico de linha baseado em `@nivo/line`, sem dependência de MUI. O componente usa tokens de cor do app definidos em `src/index.css` para título, eixos, grid, tooltip, legendas e estados (`loading`, erro e vazio), respeitando light/dark automaticamente.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className={storyWrapperClassName} style={{ minWidth: 1200 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    title: "Activity (Cumulative)",
    data: monthlySeries,
    yLabel: "Items",
    height: 420,
  },
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const MultiplasSeries: Story = {
  args: {
    title: "Queue Throughput",
    yLabel: "Jobs",
    data: queueSeries,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Exemplo com três séries e legendas ativas para demonstrar contraste, grid e interação de hover.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    data: monthlySeries,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Estado de carregamento sem MUI usando o `Loader` compartilhado do app.",
      },
    },
  },
};

export const Erro: Story = {
  args: {
    error: "Falha ao carregar a série histórica.",
    data: monthlySeries,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Exibe apenas o texto de erro no gráfico e dispara `toast.error` como feedback global.",
      },
    },
  },
};

export const SemDados: Story = {
  args: {
    data: [{ id: "Commits", data: [] }],
    emptyMessage: "Nenhum ponto foi encontrado para os filtros selecionados.",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Estado vazio com estilo mínimo, mantendo legibilidade e contraste pelo tema global.",
      },
    },
  },
};

export const ComparacaoDeModo: Story = {
  render: () => {
    const darkModeVars = {
      "--color-app-bg": "#15161f",
      "--color-app-fg": "#5f81ff",
      "--theme-secondary": "#5f81ff",
      "--theme-secondary-15": "rgba(95, 129, 255, 0.15)",
      "--theme-secondary-25": "rgba(95, 129, 255, 0.25)",
      "--theme-secondary-50": "rgba(95, 129, 255, 0.5)",
      "--theme-secondary-70": "rgba(95, 129, 255, 0.7)",
      "--theme-secondary-90": "rgba(95, 129, 255, 0.9)",
      "--theme-border-subtle": "rgba(95, 129, 255, 0.2)",
      "--color-sidebar-border": "rgba(95, 129, 255, 0.22)",
      "--color-status-in-progress-color": "#a8b4ff",
      "--color-status-in-queue-color": "#ffd36b",
      "--color-status-finished-color": "#63e6cf",
      "--color-status-failure-color": "#ff8da1",
    } as CSSProperties;

    const lightModeVars = {
      "--color-app-bg": "#f3f4f7",
      "--color-app-fg": "#0e1862",
      "--theme-secondary": "#0e1862",
      "--theme-secondary-15": "rgba(14, 24, 98, 0.15)",
      "--theme-secondary-25": "rgba(14, 24, 98, 0.25)",
      "--theme-secondary-50": "rgba(14, 24, 98, 0.5)",
      "--theme-secondary-70": "rgba(14, 24, 98, 0.7)",
      "--theme-secondary-90": "rgba(14, 24, 98, 0.9)",
      "--theme-border-subtle": "rgba(14, 24, 98, 0.16)",
      "--color-sidebar-border": "rgba(14, 24, 98, 0.16)",
      "--color-status-in-progress-color": "#6675e6",
      "--color-status-in-queue-color": "#d08a12",
      "--color-status-finished-color": "#1f9b8f",
      "--color-status-failure-color": "#e35d72",
    } as CSSProperties;

    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <section className={storyWrapperClassName} style={darkModeVars}>
          <p className="mb-3 text-sm font-semibold">Modo escuro (app)</p>
          <LineChart
            title="Queue Throughput"
            data={queueSeries}
            yLabel="Jobs"
            height={380}
          />
        </section>

        <section className={storyWrapperClassName} style={lightModeVars}>
          <p className="mb-3 text-sm font-semibold">Modo claro (app)</p>
          <LineChart
            title="Queue Throughput"
            data={queueSeries}
            yLabel="Jobs"
            height={380}
          />
        </section>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstra o componente respondendo aos tokens de cor do app em light/dark sem variantes internas específicas.",
      },
    },
  },
};

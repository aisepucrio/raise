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
  "rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)";

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
      "--color-primary": "var(--color-slate-950)",
      "--color-primary-inverse": "var(--color-indigo-500)",
      "--color-secondary": "var(--color-indigo-500)",
      "--color-secondary-inverse": "var(--color-slate-950)",
      "--color-indigo": "var(--color-indigo-200)",
      "--color-amber": "var(--color-amber-300)",
      "--color-teal": "var(--color-teal-300)",
      "--color-rose": "var(--color-rose-300)",
    } as CSSProperties;

    const lightModeVars = {
      "--color-primary": "var(--color-slate-050)",
      "--color-primary-inverse": "var(--color-indigo-950)",
      "--color-secondary": "var(--color-indigo-950)",
      "--color-secondary-inverse": "var(--color-slate-050)",
      "--color-indigo": "var(--color-indigo-400)",
      "--color-amber": "var(--color-amber-700)",
      "--color-teal": "var(--color-teal-700)",
      "--color-rose": "var(--color-rose-600)",
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

import type { Meta, StoryObj } from "@storybook/react-vite";

import type { LineSeries } from "@/components/line-chart";
import { OverviewChartSection } from "./OverviewChartSection";

const GRAPH_DATA: LineSeries[] = [
  {
    id: "Issues",
    data: [
      { x: "Jan", y: 12 },
      { x: "Feb", y: 25 },
      { x: "Mar", y: 34 },
      { x: "Apr", y: 41 },
      { x: "May", y: 52 },
    ],
  },
  {
    id: "Pull Requests",
    data: [
      { x: "Jan", y: 8 },
      { x: "Feb", y: 17 },
      { x: "Mar", y: 21 },
      { x: "Apr", y: 29 },
      { x: "May", y: 33 },
    ],
  },
];

const meta = {
  title: "Components/Overview/OverviewChartSection",
  component: OverviewChartSection,
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: { type: "text" },
      description: "Título exibido no cabeçalho do gráfico.",
      table: { type: { summary: "string" } },
    },
    data: {
      control: false,
      description: "Séries de dados no formato esperado pelo gráfico de linha.",
      table: { type: { summary: "LineSeries[]" } },
    },
    loading: {
      control: { type: "boolean" },
      description: "Ativa o estado de carregamento.",
      table: { type: { summary: "boolean" } },
    },
    error: {
      control: { type: "text" },
      description: "Mensagem de erro exibida no lugar do gráfico.",
      table: { type: { summary: "string | null" } },
    },
    emptyMessage: {
      control: { type: "text" },
      description: "Mensagem exibida quando não há pontos para renderizar.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    title: "GitHub Activity",
    data: GRAPH_DATA,
    loading: false,
    error: null,
    emptyMessage: "No series found for the selected filters.",
  },
  parameters: {
    wrapperSize: "large",
    docs: {
      description: {
        component:
          "Seção principal do gráfico na tela de overview.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full min-w-[1100px] rounded-xl border border-(--color-secondary-soft) bg-(--color-primary)">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OverviewChartSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Estado padrão com dados carregados e prontos para leitura.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Estado de carregamento da seção de gráfico.",
      },
    },
  },
};

export const Empty: Story = {
  args: {
    data: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Estado vazio quando nenhum ponto retorna para os filtros.",
      },
    },
  },
};

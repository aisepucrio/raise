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
  args: {
    title: "GitHub Activity",
    data: GRAPH_DATA,
    loading: false,
    error: null,
    emptyMessage: "No series found for the selected filters.",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Área do gráfico principal do overview com espaçamento, altura e paleta padronizados.",
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

export const Padrao: Story = {};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
  },
};

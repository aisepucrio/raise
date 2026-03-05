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
    title: {
      control: { type: "text" },
      description: "title shown above of the chart.",
      table: { type: { summary: "string" } },
    },
    data: {
      control: false,
      description: "series in the format `{ id, date[] }` consumed pelo Nivo.",
      table: { type: { summary: "LineSeries[]" } },
    },
    loading: {
      control: { type: "boolean" },
      description: "Ativa state of loading with loader.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    error: {
      control: { type: "text" },
      description: "message of error shown in the place of the chart.",
      table: { type: { summary: "string | null" }, defaultValue: { summary: "null" } },
    },
    height: {
      control: { type: "number" },
      description: "Altura of the area of the chart in pixels.",
      table: { type: { summary: "number" }, defaultValue: { summary: "450" } },
    },
    yLabel: {
      control: { type: "text" },
      description: "label of the eixo Y.",
      table: { type: { summary: "string" } },
    },
    emptyMessage: {
      control: { type: "text" },
      description: "message shown when there is no data for rendering.",
      table: { type: { summary: "string" } },
    },
    colors: {
      control: false,
      description: "Paleta of cores fixa ou function for resolver color for series.",
      table: { type: { summary: "string[] | ((serie: { id: string }) => string)" } },
    },
  },
  parameters: {
    wrapperSize: "large",
    docs: {
      story: {
        iframeHeight: 900,
      },
      description: {
        component:
          "Line chart based on `@nivo/line` to display time series with loading, error, and empty states.",
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "view standard with series mensal of atividade.",
      },
    },
  },
};

export const MultiplasSeries: Story = {
  args: {
    title: "Queue Throughput",
    yLabel: "Jobs",
    data: queueSeries,
  },
  parameters: {
    docs: {
      description: {
        story: "Example with multiple series in the same chart.",
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
        story: "displays the state of loading.",
      },
    },
  },
};

export const error: Story = {
  args: {
    error: "failure to load a series historical.",
    data: monthlySeries,
  },
  parameters: {
    docs: {
      description: {
        story: "displays the state of error of the chart.",
      },
    },
  },
};

export const NoData: Story = {
  args: {
    data: [{ id: "Commits", data: [] }],
    emptyMessage: "Nenhum ponto foi encontrado for the filters selected.",
  },
  parameters: {
    docs: {
      description: {
        story: "displays the state empty when there are no points to show.",
      },
    },
  },
};

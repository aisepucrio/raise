import type { Meta, StoryObj } from "@storybook/react-vite";

import type { LineSeries } from "@/components/line-chart";
import { OverviewChartSection } from "./OverviewChartSection";

const GRAPH_date: LineSeries[] = [
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
      description: "title shown in the header of the chart.",
      table: { type: { summary: "string" } },
    },
    data: {
      control: false,
      description: "Data series in the format expected by the line chart.",
      table: { type: { summary: "LineSeries[]" } },
    },
    loading: {
      control: { type: "boolean" },
      description: "Enables loading state.",
      table: { type: { summary: "boolean" } },
    },
    error: {
      control: { type: "text" },
      description: "Error message shown in place of the chart.",
      table: { type: { summary: "string | null" } },
    },
    emptyMessage: {
      control: { type: "text" },
      description: "Message shown when there are no points to render.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    title: "GitHub Activity",
    data: GRAPH_date,
    loading: false,
    error: null,
    emptyMessage: "No series found for the selected filters.",
  },
  parameters: {
    wrapperSize: "large",
    docs: {
      description: {
        component:
          "Main chart section on the overview screen.",
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Default state with loaded data ready to read.",
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
        story: "Loading state for the chart section.",
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
        story: "Empty state when no points are returned for filters.",
      },
    },
  },
};

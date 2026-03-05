import type { Meta, StoryObj } from "@storybook/react-vite";

import { OverviewLayout } from "./OverviewLayout";

const panelClassName =
  "rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-3 text-sm text-(--color-secondary-muted)";

const meta = {
  title: "Components/Overview/OverviewLayout",
  component: OverviewLayout,
  tags: ["autodocs"],
  argTypes: {
    filters: {
      control: false,
      description: "block rendered in the area top of the panel main.",
      table: { type: { summary: "ReactNode" } },
    },
    chart: {
      control: false,
      description: "block main of content (chart).",
      table: { type: { summary: "ReactNode" } },
    },
    stats: {
      control: false,
      description: "block side of metrics/summary.",
      table: { type: { summary: "ReactNode" } },
    },
  },
  parameters: {
    wrapperSize: "large",
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Main overview layout with content area and side area.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-6xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OverviewLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <OverviewLayout
      filters={<div className={panelClassName}>filters</div>}
      chart={<div className={panelClassName}>chart</div>}
      stats={<div className={panelClassName}>cards</div>}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Example estrutural with filters, chart and area side of cards.",
      },
    },
  },
};

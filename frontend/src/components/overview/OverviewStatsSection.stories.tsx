import type { Meta, StoryObj } from "@storybook/react-vite";

import { OverviewStatsSection } from "./OverviewStatsSection";

const meta = {
  title: "Components/Overview/OverviewStatsSection",
  component: OverviewStatsSection,
  tags: ["autodocs"],
  argTypes: {
    items: {
      control: false,
      description: "list of metrics shown in the column side.",
      table: { type: { summary: "InfoBoxGridItem[]" } },
    },
  },
  args: {
    items: [
      { title: "Repositories", number: "24" },
      { title: "Issues", number: "4,892" },
      { title: "Pull Requests", number: "1,264" },
      { title: "Commits", number: "8,120" },
      { title: "Users", number: "352" },
    ],
  },
  parameters: {
    wrapperSize: "large",
    docs: {
      description: {
        component:
          "Side section to display metric cards.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm rounded-xl border border-(--color-secondary-soft) bg-(--color-primary)">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OverviewStatsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Renderiza set complete of cards of metrics.",
      },
    },
  },
};

export const WithFewCards: Story = {
  args: {
    items: [
      { title: "Issues", number: "1,280" },
      { title: "Users", number: "94" },
      { title: "Projects", number: "12" },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Example with quantity reduced of cards.",
      },
    },
  },
};

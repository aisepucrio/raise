import type { Meta, StoryObj } from "@storybook/react-vite";

import { OverviewStatsSection } from "./OverviewStatsSection";

const meta = {
  title: "Components/Overview/OverviewStatsSection",
  component: OverviewStatsSection,
  tags: ["autodocs"],
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
          "Seção lateral para exibir métricas em cards.",
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

export const Padrao: Story = {};

export const ComPoucosCards: Story = {
  args: {
    items: [
      { title: "Issues", number: "1,280" },
      { title: "Users", number: "94" },
      { title: "Projects", number: "12" },
    ],
  },
};

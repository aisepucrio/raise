import type { Meta, StoryObj } from "@storybook/react-vite";

import { OverviewLayout } from "./OverviewLayout";

const panelClassName =
  "rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-3 text-sm text-(--color-secondary-muted)";

const meta = {
  title: "Components/Overview/OverviewLayout",
  component: OverviewLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Layout principal do overview com área de conteúdo e área lateral.",
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

export const Padrao: Story = {
  render: () => (
    <OverviewLayout
      filters={<div className={panelClassName}>filtros</div>}
      chart={<div className={panelClassName}>gráfico</div>}
      stats={<div className={panelClassName}>cards</div>}
    />
  ),
};

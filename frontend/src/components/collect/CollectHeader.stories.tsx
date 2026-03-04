import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectHeader } from "./CollectHeader";

const meta = {
  title: "Components/Collect/CollectHeader",
  component: CollectHeader,
  tags: ["autodocs"],
  argTypes: {
    onAddClick: { action: "addClick" },
  },
  args: {
    title: "GitHub Collect",
    description: "Configure repositories and optional date range.",
    addButtonText: "Add repository",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Cabeçalho de coleta com título, descrição e ação principal.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CollectHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectActions } from "./CollectActions";

const meta = {
  title: "Components/Collect/CollectActions",
  component: CollectActions,
  tags: ["autodocs"],
  argTypes: {
    onCollect: { action: "collectClick" },
  },
  args: {
    collectButtonText: "Collect",
    collectPendingButtonText: "Collecting...",
    isCollectPending: false,
    isCollectDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Bloco de ações finais da coleta, com estados normal, pendente e desabilitado.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="flex w-full max-w-xl justify-end rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CollectActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const Pendente: Story = {
  args: {
    isCollectPending: true,
    isCollectDisabled: true,
  },
};

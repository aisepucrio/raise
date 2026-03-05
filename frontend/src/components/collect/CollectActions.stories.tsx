import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectActions } from "./CollectActions";

const meta = {
  title: "Components/Collect/CollectActions",
  component: CollectActions,
  tags: ["autodocs"],
  argTypes: {
    collectButtonText: {
      control: { type: "text" },
      description: "Texto do botão no estado normal.",
      table: { type: { summary: "string" } },
    },
    collectPendingButtonText: {
      control: { type: "text" },
      description: "Texto exibido quando a coleta está pendente.",
      table: { type: { summary: "string" } },
    },
    onCollect: {
      action: "collectClick",
      description: "Callback disparado ao clicar no botão de coleta.",
      table: { type: { summary: "() => void" } },
    },
    isCollectPending: {
      control: { type: "boolean" },
      description: "Indica estado pendente da coleta.",
      table: { type: { summary: "boolean" } },
    },
    isCollectDisabled: {
      control: { type: "boolean" },
      description: "Desabilita o botão de coleta.",
      table: { type: { summary: "boolean" } },
    },
  },
  args: {
    collectButtonText: "Collect",
    collectPendingButtonText: "Collecting...",
    isCollectPending: false,
    isCollectDisabled: false,
  },
  parameters: {
    wrapperSize: "medium",
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

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Ação padrão habilitada para iniciar coleta.",
      },
    },
  },
};

export const Pendente: Story = {
  args: {
    isCollectPending: true,
    isCollectDisabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Estado pendente com botão bloqueado e texto de progresso.",
      },
    },
  },
};

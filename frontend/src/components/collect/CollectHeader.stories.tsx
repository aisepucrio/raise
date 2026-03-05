import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectHeader } from "./CollectHeader";

const meta = {
  title: "Components/Collect/CollectHeader",
  component: CollectHeader,
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: { type: "text" },
      description: "Título principal da seção de coleta.",
      table: { type: { summary: "string" } },
    },
    description: {
      control: { type: "text" },
      description: "Descrição auxiliar da seção.",
      table: { type: { summary: "string" } },
    },
    addButtonText: {
      control: { type: "text" },
      description: "Texto do botão de adicionar item.",
      table: { type: { summary: "string" } },
    },
    onAddClick: {
      action: "addClick",
      description: "Callback disparado ao clicar em adicionar.",
      table: { type: { summary: "() => void" } },
    },
  },
  args: {
    title: "GitHub Collect",
    description: "Configure repositories and optional date range.",
    addButtonText: "Add repository",
  },
  parameters: {
    wrapperSize: "medium",
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

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Cabeçalho padrão com título, descrição e ação principal.",
      },
    },
  },
};

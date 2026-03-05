import type { Meta, StoryObj } from "@storybook/react-vite";

import { RemovableTag } from "./removableTag";

const meta = {
  title: "Components/RemovableTag",
  component: RemovableTag,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: { type: "text" },
      description: "Texto exibido na tag.",
      table: { type: { summary: "string" } },
    },
    onRemove: {
      action: "remove",
      description: "Callback disparado ao clicar no botão de remoção.",
      table: { type: { summary: "() => void" } },
    },
  },
  args: {
    label: "openai/openai-python",
  },
  parameters: {
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Tag com ação de remoção para listas de itens selecionados.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-6 text-(--color-secondary)">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RemovableTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Tag removível com rótulo curto.",
      },
    },
  },
};

export const RotuloLongo: Story = {
  args: {
    label: "very-long-owner-name/very-long-repository-name-example",
  },
  parameters: {
    docs: {
      description: {
        story: "Valida quebra de linha/comportamento com texto longo.",
      },
    },
  },
};

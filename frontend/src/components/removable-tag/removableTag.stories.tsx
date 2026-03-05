import type { Meta, StoryObj } from "@storybook/react-vite";

import { RemovableTag } from "./removableTag";

const meta = {
  title: "Components/RemovableTag",
  component: RemovableTag,
  tags: ["autodocs"],
  argTypes: {
    onRemove: { action: "remove" },
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

export const Padrao: Story = {};

export const RotuloLongo: Story = {
  args: {
    label: "very-long-owner-name/very-long-repository-name-example",
  },
};

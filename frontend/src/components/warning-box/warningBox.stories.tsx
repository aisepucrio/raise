import type { Meta, StoryObj } from "@storybook/react-vite";

import { WarningBox } from "./warningBox";

const meta = {
  title: "Components/WarningBox",
  component: WarningBox,
  tags: ["autodocs"],
  args: {
    text: "Start and finish dates are required for Stack Overflow.",
    variant: "warning",
    width: "full",
  },
  argTypes: {
    variant: {
      control: { type: "inline-radio" },
      options: ["default", "success", "info", "warning", "error"],
    },
    width: {
      control: { type: "inline-radio" },
      options: ["full", "auto"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Caixa de aviso sem botão de fechar. Usa variantes fixas de cor (`default`, `success`, `info`, `warning`, `error`) e largura configurável (`full` ou `auto`).",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WarningBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="space-y-2">
      <WarningBox text="Default message." variant="default" />
      <WarningBox text="Saved with success." variant="success" />
      <WarningBox text="Heads up: check your filters." variant="info" />
      <WarningBox text="Dates are required before collecting." variant="warning" />
      <WarningBox text="Failed to start collection." variant="error" />
    </div>
  ),
};

export const AutoWidth: Story = {
  args: {
    width: "auto",
  },
};

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
    text: {
      control: { type: "text" },
      description: "message shown inside of the caixa.",
      table: { type: { summary: "string" } },
    },
    variant: {
      control: { type: "inline-radio" },
      options: ["default", "success", "info", "warning", "error"],
      description: "Variante semantic/visual of the caixa.",
      table: {
        type: {
          summary:
            "\"default\" | \"success\" | \"info\" | \"warning\" | \"error\"",
        },
        defaultValue: { summary: "warning" },
      },
    },
    width: {
      control: { type: "inline-radio" },
      options: ["full", "auto"],
      description: "Define se the component occupies entire the width ou only content.",
      table: { type: { summary: "\"full\" | \"auto\"" }, defaultValue: { summary: "full" } },
    },
    className: {
      control: false,
      description: "Classe CSS adicional aplieach to container.",
      table: { type: { summary: "string" } },
    },
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Warning box with status variants and configurable width.",
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

export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story: "Playground for testar text, variante and width.",
      },
    },
  },
};

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
  parameters: {
    docs: {
      description: {
        story: "comparison of entires the variants visual available.",
      },
    },
  },
};

export const AutoWidth: Story = {
  args: {
    width: "auto",
  },
  parameters: {
    docs: {
      description: {
        story: "Caixa adjusted to content with width automatic.",
      },
    },
  },
};

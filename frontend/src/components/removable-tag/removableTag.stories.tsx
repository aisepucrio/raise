import type { Meta, StoryObj } from "@storybook/react-vite";

import { RemovableTag } from "./removableTag";

const meta = {
  title: "Components/RemovableTag",
  component: RemovableTag,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: { type: "text" },
      description: "text shown in the tag.",
      table: { type: { summary: "string" } },
    },
    onRemove: {
      action: "removes",
      description: "Callback triggered to click in the button of removal.",
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
          "Tag with removal action for lists of selected items.",
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Tag removable with label short.",
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
        story: "validates quebra of row/behavior with text longo.",
      },
    },
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectActions } from "./CollectActions";

const meta = {
  title: "Components/Collect/CollectActions",
  component: CollectActions,
  tags: ["autodocs"],
  argTypes: {
    collectButtonText: {
      control: { type: "text" },
      description: "Button text in normal state.",
      table: { type: { summary: "string" } },
    },
    collectPendingButtonText: {
      control: { type: "text" },
      description: "Text shown while collection is pending.",
      table: { type: { summary: "string" } },
    },
    onCollect: {
      action: "collectClick",
      description: "Callback triggered on collect button click.",
      table: { type: { summary: "() => void" } },
    },
    isCollectPending: {
      control: { type: "boolean" },
      description: "Indicates pending collection state.",
      table: { type: { summary: "boolean" } },
    },
    isCollectDisabled: {
      control: { type: "boolean" },
      description: "Disables collect button.",
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
          "Final action block for collection, with normal, pending, and disabled states.",
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Default enabled action to start collection.",
      },
    },
  },
};

export const Pending: Story = {
  args: {
    isCollectPending: true,
    isCollectDisabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Pending state with disabled button and progress text.",
      },
    },
  },
};

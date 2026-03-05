import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectHeader } from "./CollectHeader";

const meta = {
  title: "Components/Collect/CollectHeader",
  component: CollectHeader,
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: { type: "text" },
      description: "title main of the section of collection.",
      table: { type: { summary: "string" } },
    },
    description: {
      control: { type: "text" },
      description: "description auxiliar of the section.",
      table: { type: { summary: "string" } },
    },
    addButtonText: {
      control: { type: "text" },
      description: "text of the button of add item.",
      table: { type: { summary: "string" } },
    },
    onAddClick: {
      action: "addClick",
      description: "Callback triggered to click in add.",
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
          "Collection header with title, description, and primary action.",
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "header standard with title, description and action main.",
      },
    },
  },
};

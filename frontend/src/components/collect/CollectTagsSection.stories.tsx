import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectTagsSection } from "./CollectTagsSection";

const ITEMS = ["acme/api", "acme/web"];

const meta = {
  title: "Components/Collect/CollectTagsSection",
  component: CollectTagsSection,
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: { type: "text" },
      description: "Title of the tags section.",
      table: { type: { summary: "string" } },
    },
    items: {
      control: false,
      description: "List of collect targets to render as removable tags.",
      table: { type: { summary: "readonly string[]" } },
    },
    emptyMessage: {
      control: { type: "text" },
      description: "Message shown when the list is empty.",
      table: { type: { summary: "string" } },
    },
    onRemoveItem: {
      action: "removeItem",
      description: "Callback triggered when an item is removed.",
      table: { type: { summary: "(item: string) => void" } },
    },
  },
  args: {
    title: "Repositories",
    emptyMessage:
      'No repositories added yet. Click the "Add repository" button above to get started.',
    items: ITEMS,
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Removable tags list with empty-state support.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CollectTagsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithItems: Story = {
  parameters: {
    docs: {
      description: {
        story: "State with repositories already added.",
      },
    },
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state showing guidance to add items.",
      },
    },
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectTagsSection } from "./CollectTagsSection";

const TAGS = [
  {
    id: "acme/api",
    label: "acme/api",
    onRemove: () => undefined,
  },
  {
    id: "acme/web",
    label: "acme/web",
    onRemove: () => undefined,
  },
];

const meta = {
  title: "Components/Collect/CollectTagsSection",
  component: CollectTagsSection,
  tags: ["autodocs"],
  argTypes: {
    tagsHeading: {
      control: { type: "text" },
      description: "Title of the tags section.",
      table: { type: { summary: "string" } },
    },
    tags: {
      control: false,
      description: "List of removable tags (`id`, `label`, `onRemove`).",
      table: { type: { summary: "readonly { id: string; label: string; onRemove: () => void }[]" } },
    },
    emptyTagsMessage: {
      control: { type: "text" },
      description: "message shown when the list of tags is empty.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    tagsHeading: "Repositories (2)",
    emptyTagsMessage:
      'No repositories added yet. Click the "Add repository" button above to get started.',
    tags: TAGS,
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
    tagsHeading: "Repositories (0)",
    tags: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state showing guidance to add items.",
      },
    },
  },
};

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
  args: {
    tagsHeading: "Repositories (2)",
    emptyTagsMessage:
      'No repositories added yet. Click the "Add repository" button above to get started.',
    tags: TAGS,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Bloco de listagem de tags removíveis usado para repositórios, projetos ou tags do collect.",
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

export const ComItens: Story = {};

export const Vazio: Story = {
  args: {
    tagsHeading: "Repositories (0)",
    tags: [],
  },
};

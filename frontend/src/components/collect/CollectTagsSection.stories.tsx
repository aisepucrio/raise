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
      description: "Título da seção de tags.",
      table: { type: { summary: "string" } },
    },
    tags: {
      control: false,
      description: "Lista de tags removíveis (`id`, `label`, `onRemove`).",
      table: { type: { summary: "readonly { id: string; label: string; onRemove: () => void }[]" } },
    },
    emptyTagsMessage: {
      control: { type: "text" },
      description: "Mensagem exibida quando a lista de tags está vazia.",
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
          "Lista de tags removíveis com suporte a estado vazio.",
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

export const ComItens: Story = {
  parameters: {
    docs: {
      description: {
        story: "Estado com repositórios já adicionados.",
      },
    },
  },
};

export const Vazio: Story = {
  args: {
    tagsHeading: "Repositories (0)",
    tags: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Estado vazio exibindo orientação para adicionar itens.",
      },
    },
  },
};

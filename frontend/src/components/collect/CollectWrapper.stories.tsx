import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectWrapper } from "./CollectWrapper";

const meta = {
  title: "Components/Collect/CollectWrapper",
  component: CollectWrapper,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Container base para organizar o conteúdo da tela de coleta.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-6xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CollectWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => (
    <CollectWrapper>
      <div className="rounded-lg border border-(--color-secondary-soft) p-3 text-sm text-(--color-secondary-muted)">
        conteúdo interno do collect
      </div>
    </CollectWrapper>
  ),
};

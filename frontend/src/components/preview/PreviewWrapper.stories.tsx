import type { Meta, StoryObj } from "@storybook/react-vite";

import { PreviewWrapper } from "./PreviewWrapper";

const meta = {
  title: "Components/Preview/PreviewWrapper",
  component: PreviewWrapper,
  tags: ["autodocs"],
  parameters: {
    wrapperSize: "large",
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Container base para organizar os blocos da tela de preview.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="px-4 py-6">
        <div className="w-full rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-6 text-(--color-secondary)">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof PreviewWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => (
    <div className="h-[24rem]">
      <PreviewWrapper>
        <div className="rounded-lg border border-dashed border-(--color-secondary-soft) p-3 text-sm text-(--color-secondary-muted)">
          Conteúdo composto pelo item principal da source.
        </div>
      </PreviewWrapper>
    </div>
  ),
};

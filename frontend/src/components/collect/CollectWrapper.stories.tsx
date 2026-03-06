import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectWrapper } from "./CollectWrapper";

const meta = {
  title: "Components/Collect/CollectWrapper",
  component: CollectWrapper,
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: false,
      description: "Inner content of the main collect area.",
      table: { type: { summary: "ReactNode" } },
    },
  },
  parameters: {
    wrapperSize: "large",
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Base container to organize collection screen content.",
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

export const Default: Story = {
  render: () => (
    <CollectWrapper>
      <div className="rounded-lg border border-(--color-secondary-soft) p-3 text-sm text-(--color-secondary-muted)">
        collect inner content
      </div>
    </CollectWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: "Base container for the Collect module with inner content.",
      },
    },
  },
};

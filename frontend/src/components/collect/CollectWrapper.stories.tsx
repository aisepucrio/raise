import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectWrapper } from "./CollectWrapper";

const meta = {
  title: "Components/Collect/CollectWrapper",
  component: CollectWrapper,
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: false,
      description: "content internal of the area main of collect.",
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
        content interno do collect
      </div>
    </CollectWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: "Container base of the module Collect with content internal.",
      },
    },
  },
};

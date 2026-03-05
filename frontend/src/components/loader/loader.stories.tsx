import type { Meta, StoryObj } from "@storybook/react-vite";

import { Loader } from "./loader";

const meta = {
  title: "Components/Loader",
  component: Loader,
  tags: ["autodocs"],
  parameters: {
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Centered loading indicator that adapts to container size.",
      },
    },
  },
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="h-36 rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4">
      <Loader />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example basic of usage in the area of loading.",
      },
    },
  },
};

export const ResizePorContainer: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="h-20 rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-2">
        <Loader />
      </div>
      <div className="h-32 rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-2">
        <Loader />
      </div>
      <div className="h-52 rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-2">
        <Loader />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mostra the behavior in containers with sizes different.",
      },
    },
  },
};

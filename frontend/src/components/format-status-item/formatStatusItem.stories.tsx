import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormatStatusItem } from "./formatStatusItem";

const meta = {
  title: "Components/FormatStatusItem",
  component: FormatStatusItem,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: { type: "text" },
      description: "Raw status received from API for normalization and display.",
      table: { type: { summary: "string | null" } },
    },
    className: {
      control: false,
      description: "Additional CSS class applied to container.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    status: "STARTED",
  },
  parameters: {
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Displays a status with friendly label and consistent color.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-6 text-(--color-secondary)">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormatStatusItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Displays a single status in final interface format.",
      },
    },
  },
};

export const StatusList: Story = {
  render: () => {
    const statuses = [
      "STARTED",
      "PENDING",
      "SUCCESS",
      "FAILURE",
      "REVOKED",
      "PROGRESS",
      "UNKNOWN",
    ];

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {statuses.map((status) => (
          <div
            key={status}
            className="flex items-center justify-between rounded-md border border-(--color-secondary-subtle) px-3 py-2"
          >
            <span className="text-sm text-(--color-secondary-muted)">{status}</span>
            <FormatStatusItem status={status} />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Compares supported statuses and their visual mappings.",
      },
    },
  },
};

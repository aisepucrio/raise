import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormatStatusItem } from "./formatStatusItem";

const meta = {
  title: "Components/FormatStatusItem",
  component: FormatStatusItem,
  tags: ["autodocs"],
  argTypes: {
    className: { control: false },
  },
  args: {
    status: "STARTED",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Exibe um status com rótulo amigável e cor consistente.",
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

export const Padrao: Story = {};

export const ListaDeStatus: Story = {
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
};

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ColumnVisibilityFilter } from "./ColumnVisibilityFilter";

function InteractiveDemo() {
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const columns = [
    "id",
    "title",
    "state",
    "repository",
    "created_at",
    "updated_at",
  ];

  const visibleColumns = columns.filter(
    (column) => !hiddenColumns.includes(column),
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="w-[13rem]">
          <ColumnVisibilityFilter
            columns={columns}
            hiddenColumns={hiddenColumns}
            onHiddenColumnsChange={setHiddenColumns}
            buttonClassName="h-11 min-h-11 py-0"
          />
        </div>
      </div>

      <div className="rounded-md border border-(--color-secondary-subtle) px-3 py-2 text-sm text-(--color-secondary-muted)">
        Visible columns:{" "}
        {visibleColumns.length > 0 ? visibleColumns.join(", ") : "none"}
      </div>
    </div>
  );
}

const meta = {
  title: "Components/ColumnVisibilityFilter",
  component: ColumnVisibilityFilter,
  tags: ["autodocs"],
  argTypes: {
    columns: {
      control: false,
      description: "Complete list of available columns.",
      table: { type: { summary: "string[]" } },
    },
    hiddenColumns: {
      control: false,
      description: "Controlled list of hidden columns.",
      table: { type: { summary: "string[]" } },
    },
    onHiddenColumnsChange: {
      control: false,
      description:
        "Callback to update hidden columns (direct value or updater).",
      table: {
        type: {
          summary:
            "(nextHiddenColumns: string[] | ((currentHiddenColumns: string[]) => string[])) => void",
        },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class for main container.",
      table: { type: { summary: "string" } },
    },
    buttonClassName: {
      control: false,
      description: "Additional CSS class for trigger button.",
      table: { type: { summary: "string" } },
    },
    menuClassName: {
      control: false,
      description: "Additional CSS class for popover/menu.",
      table: { type: { summary: "string" } },
    },
    title: {
      control: { type: "text" },
      description: "title shown in the menu of columns.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Visible columns" } },
    },
    description: {
      control: { type: "text" },
      description: "Auxiliary text shown in the columns menu.",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "Select which columns should appear in the table." },
      },
    },
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Menu to show or hide table columns.",
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
} satisfies Meta<typeof ColumnVisibilityFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: "Interactive menu to hide/show columns with visual summary.",
      },
    },
  },
};

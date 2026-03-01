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
    onHiddenColumnsChange: { control: false },
    className: { control: false },
    buttonClassName: { control: false },
    menuClassName: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Popover reutilizável para mostrar/ocultar colunas de uma tabela. Ele centraliza contagem de colunas visíveis, seleção por checkbox e ações rápidas de show/hide all.",
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

export const Padrao: Story = {
  render: () => <InteractiveDemo />,
};

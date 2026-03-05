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
      description: "Lista completa de colunas disponíveis.",
      table: { type: { summary: "string[]" } },
    },
    hiddenColumns: {
      control: false,
      description: "Lista controlada de colunas ocultas.",
      table: { type: { summary: "string[]" } },
    },
    onHiddenColumnsChange: {
      control: false,
      description:
        "Callback para atualizar colunas ocultas (valor direto ou updater).",
      table: {
        type: {
          summary:
            "(nextHiddenColumns: string[] | ((currentHiddenColumns: string[]) => string[])) => void",
        },
      },
    },
    className: {
      control: false,
      description: "Classe CSS adicional do container principal.",
      table: { type: { summary: "string" } },
    },
    buttonClassName: {
      control: false,
      description: "Classe CSS adicional do botão gatilho.",
      table: { type: { summary: "string" } },
    },
    menuClassName: {
      control: false,
      description: "Classe CSS adicional do popover/menu.",
      table: { type: { summary: "string" } },
    },
    title: {
      control: { type: "text" },
      description: "Título exibido no menu de colunas.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Visible columns" } },
    },
    description: {
      control: { type: "text" },
      description: "Texto auxiliar exibido no menu de colunas.",
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
          "Menu para mostrar ou ocultar colunas de uma tabela.",
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
  parameters: {
    docs: {
      description: {
        story: "Menu interativo para ocultar/exibir colunas com resumo visual.",
      },
    },
  },
};

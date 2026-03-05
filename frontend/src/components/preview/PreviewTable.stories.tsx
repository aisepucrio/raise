import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { toPreviewString, type PreviewRow } from "@/sources/shared/PreviewShared";
import { PreviewTable, type PreviewSortState } from "./PreviewTable";

const SAMPLE_ROWS: PreviewRow[] = [
  { id: 1, title: "Adjust authentication", status: "open", author: "ana" },
  { id: 2, title: "Refatorar preview", status: "closed", author: "bruno" },
  { id: 3, title: "Improve pagination", status: "open", author: "carla" },
  { id: 4, title: "add testes", status: "in_review", author: "diego" },
  { id: 5, title: "Document module", status: "open", author: "erika" },
  { id: 6, title: "Corrigir filters", status: "closed", author: "felipe" },
  { id: 7, title: "Padronizar types", status: "open", author: "gabi" },
];

const COLUMNS = ["id", "title", "status", "author"];

function InteractiveDemo() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortState, setSortState] = useState<PreviewSortState>(null);
  const [lastPreviewValue, setLastPreviewValue] = useState("");

  const sortedRows = useMemo(() => {
    if (!sortState?.field) return SAMPLE_ROWS;

    const direction = sortState.direction === "asc" ? 1 : -1;
    return [...SAMPLE_ROWS].sort((left, right) => {
      const leftValue = String(left[sortState.field] ?? "");
      const rightValue = String(right[sortState.field] ?? "");
      return leftValue.localeCompare(rightValue) * direction;
    });
  }, [sortState]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  return (
    <div className="space-y-3">
      <div className="h-[30rem]">
        <PreviewTable
          rows={pagedRows}
          visibleColumns={COLUMNS}
          tableColumns={COLUMNS}
          sortState={sortState}
          onSort={(field) => {
            setSortState((currentState) => {
              if (!currentState || currentState.field !== field) {
                return { field, direction: "asc" };
              }
              return {
                field,
                direction: currentState.direction === "asc" ? "desc" : "asc",
              };
            });
          }}
          onOpenCellPreview={(value) => setLastPreviewValue(toPreviewString(value))}
          isTablePending={false}
          emptyStateMessage="No rows found."
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalItems={sortedRows.length}
          itemsLabel="rows"
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(nextRowsPerPage) => {
            setRowsPerPage(nextRowsPerPage);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="rounded-md border border-(--color-secondary-subtle) px-3 py-2 text-sm text-(--color-secondary-muted)">
        preview clicked: {lastPreviewValue || "(none)"}
      </div>
    </div>
  );
}

const meta = {
  title: "Components/Preview/PreviewTable",
  component: PreviewTable,
  tags: ["autodocs"],
  argTypes: {
    rows: {
      control: false,
      description: "rows shown in the page atual of the table.",
      table: { type: { summary: "PreviewRow[]" } },
    },
    visibleColumns: {
      control: false,
      description: "list of columns visible for rendering.",
      table: { type: { summary: "string[]" } },
    },
    tableColumns: {
      control: false,
      description: "list complete and ordenada of columns of the table.",
      table: { type: { summary: "string[]" } },
    },
    sortState: {
      control: false,
      description: "state of sorting atual (`field` + `direction`) ou `null`.",
      table: { type: { summary: "{ field: string; direction: 'asc' | 'desc' } | null" } },
    },
    onSort: {
      control: false,
      description: "Callback called to acionar sorting in the column.",
      table: { type: { summary: "(field: string) => void" } },
    },
    onOpenCellPreview: {
      control: false,
      description: "Callback called to open the preview of the cell.",
      table: { type: { summary: "(value: string | number | boolean | object | null) => void" } },
    },
    isTablePending: {
      control: { type: "boolean" },
      description: "Ativa state of loading of the table.",
      table: { type: { summary: "boolean" } },
    },
    emptyStateMessage: {
      control: { type: "text" },
      description: "message shown when there are no rows to show.",
      table: { type: { summary: "string" } },
    },
    currentPage: {
      control: { type: "number" },
      description: "page atual (indexada in 1).",
      table: { type: { summary: "number" } },
    },
    rowsPerPage: {
      control: { type: "number" },
      description: "quantity of rows shown for page.",
      table: { type: { summary: "number" } },
    },
    totalItems: {
      control: { type: "number" },
      description: "quantity total of items for pagination.",
      table: { type: { summary: "number" } },
    },
    itemsLabel: {
      control: { type: "text" },
      description: "label textual used in the footer of pagination.",
      table: { type: { summary: "string" } },
    },
    onPageChange: {
      control: false,
      description: "Callback called to navegar between pages.",
      table: { type: { summary: "(nextPage: number) => void" } },
    },
    onRowsPerPageChange: {
      control: false,
      description: "Callback called to trocar rows for page.",
      table: { type: { summary: "(nextRowsPerPage: number) => void" } },
    },
  },
  parameters: {
    wrapperSize: "large",
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "table de preview com sorting, states de loading/empty e pagination.",
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
} satisfies Meta<typeof PreviewTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: "Fluxo complete with sorting, pagination and abertura of preview for cell.",
      },
    },
  },
};

export const Carregando: Story = {
  args: {
    rows: [],
    visibleColumns: COLUMNS,
    tableColumns: COLUMNS,
    sortState: null,
    onSort: () => {},
    onOpenCellPreview: () => {},
    isTablePending: true,
    emptyStateMessage: "in rows found.",
    currentPage: 1,
    rowsPerPage: 10,
    totalItems: 0,
    itemsLabel: "rows",
    onPageChange: () => {},
    onRowsPerPageChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "state of loading While the date of the table ainda are sendo loaded.",
      },
    },
  },
};

export const NoResults: Story = {
  args: {
    rows: [],
    visibleColumns: COLUMNS,
    tableColumns: COLUMNS,
    sortState: null,
    onSort: () => {},
    onOpenCellPreview: () => {},
    isTablePending: false,
    emptyStateMessage: "in rows found.",
    currentPage: 1,
    rowsPerPage: 10,
    totalItems: 0,
    itemsLabel: "rows",
    onPageChange: () => {},
    onRowsPerPageChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "state empty with table pronta, mas without records retornados.",
      },
    },
  },
};

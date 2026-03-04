import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { toPreviewString, type PreviewRow } from "@/sources/shared/PreviewShared";
import { PreviewTable, type PreviewSortState } from "./PreviewTable";

const SAMPLE_ROWS: PreviewRow[] = [
  { id: 1, title: "Ajustar autenticação", status: "open", author: "ana" },
  { id: 2, title: "Refatorar preview", status: "closed", author: "bruno" },
  { id: 3, title: "Melhorar paginação", status: "open", author: "carla" },
  { id: 4, title: "Adicionar testes", status: "in_review", author: "diego" },
  { id: 5, title: "Documentar módulo", status: "open", author: "erika" },
  { id: 6, title: "Corrigir filtros", status: "closed", author: "felipe" },
  { id: 7, title: "Padronizar tipos", status: "open", author: "gabi" },
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
    onSort: { control: false },
    onOpenCellPreview: { control: false },
    onPageChange: { control: false },
    onRowsPerPageChange: { control: false },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Tabela de preview com ordenação, estados de carregamento/vazio e paginação.",
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

export const Padrao: Story = {
  render: () => <InteractiveDemo />,
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
    emptyStateMessage: "No rows found.",
    currentPage: 1,
    rowsPerPage: 10,
    totalItems: 0,
    itemsLabel: "rows",
    onPageChange: () => {},
    onRowsPerPageChange: () => {},
  },
};

export const SemResultados: Story = {
  args: {
    rows: [],
    visibleColumns: COLUMNS,
    tableColumns: COLUMNS,
    sortState: null,
    onSort: () => {},
    onOpenCellPreview: () => {},
    isTablePending: false,
    emptyStateMessage: "No rows found.",
    currentPage: 1,
    rowsPerPage: 10,
    totalItems: 0,
    itemsLabel: "rows",
    onPageChange: () => {},
    onRowsPerPageChange: () => {},
  },
};

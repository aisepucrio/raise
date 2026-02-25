import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TablePaginationFooter } from "./tablePaginationFooter";

function InteractiveDemo({
  totalItems = 87,
  initialPage = 1,
  initialRowsPerPage = 10,
}: {
  totalItems?: number;
  initialPage?: number;
  initialRowsPerPage?: number;
}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-(--color-table-border) px-3 py-2 text-sm text-(--color-table-caption)">
        Demo context: total items = {totalItems}, page = {currentPage}, rows/page ={" "}
        {rowsPerPage}
      </div>

      <TablePaginationFooter
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        totalItems={totalItems}
        itemsLabel="jobs"
        rowsPerPageSelectId="storybook-table-pagination-footer"
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(nextRowsPerPage) => {
          setRowsPerPage(nextRowsPerPage);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}

const meta = {
  title: "Components/TablePaginationFooter",
  component: TablePaginationFooter,
  tags: ["autodocs"],
  argTypes: {
    onPageChange: { control: false },
    onRowsPerPageChange: { control: false },
    className: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Rodapé reutilizável para tabelas com resumo de faixa, paginação centralizada e seletor de quantidade por página. Centraliza o layout e cálculos básicos da paginação visual.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-6 text-(--color-app-fg) overflow-x-auto">
        <div className="min-w-[52rem]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof TablePaginationFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => <InteractiveDemo />,
};

export const Vazio: Story = {
  render: () => <InteractiveDemo totalItems={0} />,
};

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
      <div className="rounded-md border border-(--color-secondary-subtle) px-3 py-2 text-sm text-(--color-secondary-muted)">
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
    currentPage: {
      control: { type: "number" },
      description: "Página atual (indexada em 1).",
      table: { type: { summary: "number" } },
    },
    rowsPerPage: {
      control: { type: "number" },
      description: "Quantidade de linhas exibidas por página.",
      table: { type: { summary: "number" } },
    },
    totalItems: {
      control: { type: "number" },
      description: "Total de itens disponíveis para paginação.",
      table: { type: { summary: "number" } },
    },
    onPageChange: {
      control: false,
      description: "Callback disparado quando o usuário navega de página.",
      table: { type: { summary: "(page: number) => void" } },
    },
    onRowsPerPageChange: {
      control: false,
      description: "Callback disparado ao alterar linhas por página.",
      table: { type: { summary: "(rowsPerPage: number) => void" } },
    },
    itemsLabel: {
      control: { type: "text" },
      description: "Rótulo de unidade usado no resumo (ex.: rows, jobs).",
      table: { type: { summary: "string" }, defaultValue: { summary: "items" } },
    },
    rowsPerPageLabel: {
      control: { type: "text" },
      description: "Texto do label do seletor de linhas por página.",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "Rows per page" },
      },
    },
    rowsPerPageSelectId: {
      control: { type: "text" },
      description: "ID aplicado no select de linhas por página.",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "table-rows-per-page" },
      },
    },
    className: {
      control: false,
      description: "Classe CSS adicional no container do rodapé.",
      table: { type: { summary: "string" } },
    },
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Rodapé de tabela com resumo de itens, paginação e seletor de linhas por página.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-6 text-(--color-secondary) overflow-x-auto">
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
  parameters: {
    docs: {
      description: {
        story: "Demonstra paginação interativa com total de itens e troca de densidade.",
      },
    },
  },
};

export const Vazio: Story = {
  render: () => <InteractiveDemo totalItems={0} />,
  parameters: {
    docs: {
      description: {
        story: "Mostra o estado sem itens, com navegação desabilitada.",
      },
    },
  },
};

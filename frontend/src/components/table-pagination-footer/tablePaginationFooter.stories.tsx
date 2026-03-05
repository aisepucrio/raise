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
      description: "Total of items available for pagination.",
      table: { type: { summary: "number" } },
    },
    onPageChange: {
      control: false,
      description: "Callback triggered when the user navega of page.",
      table: { type: { summary: "(page: number) => void" } },
    },
    onRowsPerPageChange: {
      control: false,
      description: "Callback triggered to change rows for page.",
      table: { type: { summary: "(rowsPerPage: number) => void" } },
    },
    itemsLabel: {
      control: { type: "text" },
      description: "label of unidade used in the summary (ex.: rows, jobs).",
      table: { type: { summary: "string" }, defaultValue: { summary: "items" } },
    },
    rowsPerPageLabel: {
      control: { type: "text" },
      description: "text of the label of the selector of rows for page.",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "Rows per page" },
      },
    },
    rowsPerPageSelectId: {
      control: { type: "text" },
      description: "ID aplicado in the select of rows for page.",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "table-rows-per-page" },
      },
    },
    className: {
      control: false,
      description: "Classe CSS adicional in the container of the footer.",
      table: { type: { summary: "string" } },
    },
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Table footer with item summary, pagination, and rows-per-page selector.",
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

export const Default: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: "Demonstra pagination interativa with total of items and switch of densidade.",
      },
    },
  },
};

export const empty: Story = {
  render: () => <InteractiveDemo totalItems={0} />,
  parameters: {
    docs: {
      description: {
        story: "Mostra the state without items, with navigation desabilitada.",
      },
    },
  },
};

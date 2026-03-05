import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { TableSortDirection } from "./table";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableSortableHead,
  TableRow,
} from "./table";

type InvoiceRow = {
  id: string;
  customer: string;
  status: "Paid" | "Pending" | "Overdue";
  value: string;
};

const rows: InvoiceRow[] = [
  { id: "INV-001", customer: "Acme LTDA", status: "Paid", value: "R$ 1.250,00" },
  { id: "INV-002", customer: "Orbit Tech", status: "Pending", value: "R$ 890,00" },
  { id: "INV-003", customer: "Nova Data", status: "Overdue", value: "R$ 2.430,00" },
];

function DemoTable({
  withCaption = false,
  withFooter = false,
  selectedRowId,
}: {
  withCaption?: boolean;
  withFooter?: boolean;
  selectedRowId?: string;
}) {
  return (
    <Table>
      {withCaption ? (
        <TableCaption>
          Example of a composable table (shadcn/ui) adapted to the app theme.
        </TableCaption>
      ) : null}

      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Value</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={row.id === selectedRowId ? "selected" : undefined}
          >
            <TableCell className="font-medium">{row.id}</TableCell>
            <TableCell>{row.customer}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell className="text-right">{row.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>

      {withFooter ? (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right font-semibold">R$ 4.570,00</TableCell>
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  );
}

function SortableHeadDemo() {
  const [sortDirection, setSortDirection] = useState<TableSortDirection>(null);

  function handleToggleSort() {
    setSortDirection((current) => {
      if (current === null) return "asc";
      if (current === "asc") return "desc";
      return null;
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableSortableHead
            sortDirection={sortDirection}
            onSort={handleToggleSort}
            title="Sort by invoice"
          >
            Invoice
          </TableSortableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Value</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.id}</TableCell>
            <TableCell>{row.customer}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell className="text-right">{row.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const meta = {
  title: "Components/Table",
  component: Table,
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: false,
      description: "Additional CSS class applied to `<table>`.",
      table: { type: { summary: "string" } },
    },
    withContainer: {
      control: { type: "boolean" },
      description: "Defines if table is wrapped in an overflow-x container.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    containerClassName: {
      control: false,
      description: "Additional CSS class for outer container (when enabled).",
      table: { type: { summary: "string" } },
    },
  },
  parameters: {
    wrapperSize: "large",
    docs: {
      description: {
        component:
          "Table component based on `shadcn/ui` with composable header, body, footer, and row states.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <DemoTable />,
  parameters: {
    docs: {
      description: {
        story: "Base table with header and content rows.",
      },
    },
  },
};

export const WithCaptionAndFooter: Story = {
  render: () => <DemoTable withCaption withFooter />,
  parameters: {
    docs: {
      description: {
        story: "Example with caption and footer.",
      },
    },
  },
};

export const SelectedRow: Story = {
  render: () => <DemoTable selectedRowId="INV-002" />,
  parameters: {
    docs: {
      description: {
        story: "Shows selected row state.",
      },
    },
  },
};

export const SortableColumn: Story = {
  render: () => <SortableHeadDemo />,
  parameters: {
    docs: {
      description: {
        story: "Example of sortable header.",
      },
    },
  },
};

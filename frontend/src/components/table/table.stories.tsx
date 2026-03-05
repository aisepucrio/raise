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
  cliente: string;
  status: "Pago" | "Pendente" | "Atrasado";
  valor: string;
};

const rows: InvoiceRow[] = [
  { id: "INV-001", cliente: "Acme LTDA", status: "Pago", valor: "R$ 1.250,00" },
  { id: "INV-002", cliente: "Orbit Tech", status: "Pendente", valor: "R$ 890,00" },
  { id: "INV-003", cliente: "Nova Dados", status: "Atrasado", valor: "R$ 2.430,00" },
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
          Exemplo de tabela composável (shadcn/ui) adaptada ao tema do app.
        </TableCaption>
      ) : null}

      <TableHeader>
        <TableRow>
          <TableHead>Fatura</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={row.id === selectedRowId ? "selected" : undefined}
          >
            <TableCell className="font-medium">{row.id}</TableCell>
            <TableCell>{row.cliente}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell className="text-right">{row.valor}</TableCell>
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
            title="Sort by fatura"
          >
            Fatura
          </TableSortableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.id}</TableCell>
            <TableCell>{row.cliente}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell className="text-right">{row.valor}</TableCell>
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
    className: { control: false },
  },
  parameters: {
    wrapperSize: "large",
    docs: {
      description: {
        component:
          "Componente de tabela baseado no `shadcn/ui`, com estrutura composável para cabeçalho, corpo, rodapé e estados de linha.",
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

export const Padrao: Story = {
  render: () => <DemoTable />,
};

export const ComCaptionERodape: Story = {
  render: () => <DemoTable withCaption withFooter />,
  parameters: {
    docs: {
      description: {
        story: "Exemplo com caption e rodapé.",
      },
    },
  },
};

export const LinhaSelecionada: Story = {
  render: () => <DemoTable selectedRowId="INV-002" />,
  parameters: {
    docs: {
      description: {
        story: "Mostra o estado de linha selecionada.",
      },
    },
  },
};

export const ColunaOrdenavel: Story = {
  render: () => <SortableHeadDemo />,
  parameters: {
    docs: {
      description: {
        story: "Exemplo de cabeçalho com ordenação.",
      },
    },
  },
};

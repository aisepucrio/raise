import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
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

const meta = {
  title: "Components/Table",
  component: Table,
  tags: ["autodocs"],
  argTypes: {
    className: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Componente de tabela vindo do `shadcn/ui`, mantido no formato composável (`Table`, `TableHeader`, `TableBody`, `TableRow`, etc.). Foi adaptado para usar tokens de cor do app definidos em `src/index.css`, então responde ao tema claro/escuro sem precisar de variantes próprias. Pode ser usado para tabelas simples, com `caption`, `footer`, destaque de linha via `data-state='selected'` e overflow horizontal automático pelo wrapper.",
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
        story:
          "Exibe `caption` e `footer`, úteis para contexto da tabela e somatórios/resumos.",
      },
    },
  },
};

export const LinhaSelecionada: Story = {
  render: () => <DemoTable selectedRowId="INV-002" />,
  parameters: {
    docs: {
      description: {
        story:
          "O destaque visual usa `data-state=\"selected\"` na `TableRow`, padrão comum do ecossistema shadcn.",
      },
    },
  },
};

export const ComparacaoDeModo: Story = {
  render: () => {
    const darkModeVars = {
      "--color-primary": "var(--color-slate-950)",
      "--color-primary-inverse": "var(--color-indigo-500)",
      "--color-secondary": "var(--color-indigo-500)",
      "--color-secondary-inverse": "var(--color-slate-950)",
    } as CSSProperties;

    const lightModeVars = {
      "--color-primary": "var(--color-slate-050)",
      "--color-primary-inverse": "var(--color-indigo-950)",
      "--color-secondary": "var(--color-indigo-950)",
      "--color-secondary-inverse": "var(--color-slate-050)",
    } as CSSProperties;

    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <section
          className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)"
          style={darkModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo escuro (app)</p>
          <DemoTable withFooter selectedRowId="INV-003" />
        </section>

        <section
          className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)"
          style={lightModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo claro (app)</p>
          <DemoTable withFooter selectedRowId="INV-001" />
        </section>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Mostra a tabela usando os tokens definidos em `src/index.css`, com troca de contraste e fundos por tema.",
      },
    },
  },
};

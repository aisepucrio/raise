import { Fragment, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";

function DemoPagination({
  currentPage = 3,
  totalPages = 8,
  className,
  onPageChange,
}: {
  currentPage?: number;
  totalPages?: number;
  className?: string;
  onPageChange?: (page: number) => void;
}) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;
  const visiblePages = Array.from(
    new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]),
  )
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={isFirstPage}
            onClick={() => {
              if (!isFirstPage) onPageChange?.(currentPage - 1);
            }}
          />
        </PaginationItem>

        {visiblePages.map((page, index) => {
          const previousPage = visiblePages[index - 1];
          const hasGap = typeof previousPage === "number" && page - previousPage > 1;

          return (
            <Fragment key={page}>
              {hasGap ? (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : null}

              <PaginationItem>
                <PaginationLink
                  text={String(page)}
                  isActive={currentPage === page}
                  aria-label={`Go to page ${page}`}
                  onClick={() => onPageChange?.(page)}
                />
              </PaginationItem>
            </Fragment>
          );
        })}

        <PaginationItem>
          <PaginationNext
            disabled={isLastPage}
            onClick={() => {
              if (!isLastPage) onPageChange?.(currentPage + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function InteractiveDemoPagination({
  initialPage = 3,
  totalPages = 8,
  className,
}: {
  initialPage?: number;
  totalPages?: number;
  className?: string;
}) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  return (
    <DemoPagination
      currentPage={currentPage}
      totalPages={totalPages}
      className={className}
      onPageChange={setCurrentPage}
    />
  );
}

function DemoTableWithPagination() {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">#1023</TableCell>
            <TableCell>Atlas Tech</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell className="text-right">R$ 320,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">#1024</TableCell>
            <TableCell>Neo Labs</TableCell>
            <TableCell>Pendente</TableCell>
            <TableCell className="text-right">R$ 180,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">#1025</TableCell>
            <TableCell>Orbit Data</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell className="text-right">R$ 510,00</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-3 text-sm text-(--color-secondary-muted)">
        <span>Mostrando 1-10 de 87 resultados</span>
        <DemoPagination
          currentPage={3}
          totalPages={9}
          className="mx-0 w-auto justify-end"
        />
      </div>
    </div>
  );
}

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: false,
      description: "Classe CSS adicional aplicada ao container `<nav>`.",
      table: { type: { summary: "string" } },
    },
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Componente de paginação baseado no `shadcn/ui`, organizado em partes composáveis para navegação entre páginas.",
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
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => <InteractiveDemoPagination initialPage={3} totalPages={8} />,
  parameters: {
    docs: {
      description: {
        story: "Exemplo interativo de navegação entre páginas.",
      },
    },
  },
};

export const PrimeiraEPaginaFinalDesabilitamNavegacao: Story = {
  render: () => (
    <div className="space-y-4">
      <DemoPagination currentPage={1} totalPages={7} />
      <DemoPagination currentPage={7} totalPages={7} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mostra os estados desabilitados na primeira e na última página.",
      },
    },
  },
};

export const UsoComTabela: Story = {
  render: () => <DemoTableWithPagination />,
  parameters: {
    docs: {
      description: {
        story: "Exemplo de uso da paginação junto com uma tabela.",
      },
    },
  },
};

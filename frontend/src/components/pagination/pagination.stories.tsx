import { Fragment, useState, type CSSProperties } from "react";
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

      <div className="flex items-center justify-between gap-3 text-sm text-(--color-pagination-ellipsis)">
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
    className: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Componente de paginação vindo do `shadcn/ui`, mantido no formato composável (`Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, etc.). Neste projeto ele foi adaptado para usar o `Button` da aplicação (`src/components/button/button.tsx`) no lugar do botão do shadcn e para consumir tokens de tema definidos em `src/index.css`, respondendo ao modo claro/escuro automaticamente. É útil para paginar tabelas, listas e grids de cards.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-4">
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
        story:
          "Exemplo interativo: clique em páginas, anterior/próximo para ver o estado selecionado alternando.",
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
        story:
          "Os controles `PaginationPrevious` e `PaginationNext` repassam `disabled` para o `Button` da app, preservando o estado visual e acessibilidade.",
      },
    },
  },
};

export const UsoComTabela: Story = {
  render: () => <DemoTableWithPagination />,
  parameters: {
    docs: {
      description: {
        story:
          "Exemplo comum de uso junto à `Table`: resumo de resultados + paginação na área inferior da tabela.",
      },
    },
  },
};

export const ComparacaoDeModo: Story = {
  render: () => {
    const darkModeVars = {
      "--color-app-bg": "var(--color-blueberry-900)",
      "--color-app-fg": "var(--color-metal-50)",
      "--color-sidebar-border": "var(--color-lighter-bluebery-900)",
      "--color-form-bg": "var(--color-metal-50)",
      "--color-form-bg-hover": "var(--color-darker-metal-50)",
      "--color-form-text": "var(--color-blueberry-900)",
      "--color-form-focus": "var(--color-darker-metal-50)",
      "--color-form-disabled-bg": "rgba(243, 244, 247, 0.6)",
      "--color-form-disabled-text": "rgba(14, 24, 98, 0.45)",
      "--color-pagination-text": "rgba(243, 244, 247, 0.9)",
      "--color-pagination-border": "rgba(243, 244, 247, 0.16)",
      "--color-pagination-hover-bg": "rgba(243, 244, 247, 0.08)",
      "--color-pagination-active-bg": "var(--color-metal-50)",
      "--color-pagination-active-text": "var(--color-blueberry-900)",
      "--color-pagination-active-border": "var(--color-metal-50)",
      "--color-pagination-disabled-text": "rgba(243, 244, 247, 0.42)",
      "--color-pagination-ellipsis": "rgba(243, 244, 247, 0.66)",
    } as CSSProperties;

    const lightModeVars = {
      "--color-app-bg": "var(--color-metal-50)",
      "--color-app-fg": "var(--color-blueberry-900)",
      "--color-sidebar-border": "var(--color-darker-metal-50)",
      "--color-form-bg": "var(--color-blueberry-900)",
      "--color-form-bg-hover": "var(--color-lighter-bluebery-900)",
      "--color-form-text": "var(--color-metal-50)",
      "--color-form-focus": "var(--color-lighter-bluebery-900)",
      "--color-form-disabled-bg": "rgba(14, 24, 98, 0.65)",
      "--color-form-disabled-text": "rgba(243, 244, 247, 0.65)",
      "--color-pagination-text": "rgba(14, 24, 98, 0.88)",
      "--color-pagination-border": "rgba(14, 24, 98, 0.14)",
      "--color-pagination-hover-bg": "rgba(14, 24, 98, 0.06)",
      "--color-pagination-active-bg": "var(--color-blueberry-900)",
      "--color-pagination-active-text": "var(--color-metal-50)",
      "--color-pagination-active-border": "var(--color-blueberry-900)",
      "--color-pagination-disabled-text": "rgba(14, 24, 98, 0.45)",
      "--color-pagination-ellipsis": "rgba(14, 24, 98, 0.68)",
    } as CSSProperties;

    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <section
          className="rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-4 text-(--color-app-fg)"
          style={darkModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo escuro (app)</p>
          <div className="overflow-x-auto">
            <InteractiveDemoPagination
              initialPage={4}
              totalPages={10}
              className="min-w-max"
            />
          </div>
        </section>

        <section
          className="rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-4 text-(--color-app-fg)"
          style={lightModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo claro (app)</p>
          <div className="overflow-x-auto">
            <InteractiveDemoPagination
              initialPage={4}
              totalPages={10}
              className="min-w-max"
            />
          </div>
        </section>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Mostra a paginação usando tokens de `src/index.css`, incluindo estados normal, hover, ativo e desabilitado em light/dark.",
      },
    },
  },
};

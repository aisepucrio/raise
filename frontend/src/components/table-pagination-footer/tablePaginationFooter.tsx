import { Fragment } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/button";
import { FormSelect } from "@/components/form";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/pagination";
import { cn } from "@/lib/utils";

export type TablePaginationFooterProps = {
  currentPage: number;
  rowsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  itemsLabel?: string;
  rowsPerPageLabel?: string;
  rowsPerPageSelectId?: string;
  className?: string;
};

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 30, 50] as const;

function getVisiblePages(currentPage: number, totalPages: number) {
  return Array.from(
    new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]),
  )
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

export function TablePaginationFooter({
  currentPage,
  rowsPerPage,
  totalItems,
  onPageChange,
  onRowsPerPageChange,
  itemsLabel = "items",
  rowsPerPageLabel = "Rows per page",
  rowsPerPageSelectId = "table-rows-per-page",
  className,
}: TablePaginationFooterProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const hasItems = totalItems > 0;
  const firstRowNumber = hasItems ? (safeCurrentPage - 1) * rowsPerPage + 1 : 0;
  const lastRowNumber = hasItems ? Math.min(safeCurrentPage * rowsPerPage, totalItems) : 0;
  const visiblePages = getVisiblePages(safeCurrentPage, totalPages);

  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center",
        className,
      )}
    >
      {/* Resumo textual da faixa visível atual. */}
      <p className="text-sm text-(--color-secondary-muted)">
        {hasItems
          ? `Showing ${firstRowNumber}-${lastRowNumber} of ${totalItems} ${itemsLabel}`
          : "No rows to paginate"}
      </p>

      {/* Paginação centralizada para manter o foco visual no rodapé. */}
      <Pagination className="mx-0 w-full justify-center">
        <PaginationContent>
          <PaginationItem>
            <Button
              fullWidth={false}
              className="w-9 min-h-8.5 px-0 py-0"
              icon={<ChevronLeft />}
              aria-label="Go to previous page"
              title="Previous page"
              disabled={safeCurrentPage <= 1 || !hasItems}
              onClick={() => {
                if (safeCurrentPage > 1) onPageChange(safeCurrentPage - 1);
              }}
            />
          </PaginationItem>

          {visiblePages.map((page, index) => {
            const previousPage = visiblePages[index - 1];
            const hasGap =
              typeof previousPage === "number" && page - previousPage > 1;

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
                    isActive={safeCurrentPage === page}
                    aria-label={`Go to page ${page}`}
                    onClick={() => onPageChange(page)}
                  />
                </PaginationItem>
              </Fragment>
            );
          })}

          <PaginationItem>
            <Button
              fullWidth={false}
              className="w-9 min-h-8.5 px-0 py-0"
              icon={<ChevronRight />}
              aria-label="Go to next page"
              title="Next page"
              disabled={safeCurrentPage >= totalPages || !hasItems}
              onClick={() => {
                if (safeCurrentPage < totalPages) onPageChange(safeCurrentPage + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Controle de densidade da tabela (rows per page). */}
      <FormSelect
        id={rowsPerPageSelectId}
        label={rowsPerPageLabel}
        labelPosition="left"
        className="min-h-0 w-20 py-1"
        value={String(rowsPerPage)}
        onChange={(event) => {
          onRowsPerPageChange(Number(event.target.value));
        }}
        wrapperClassName="md:justify-self-end"
      >
        {ROWS_PER_PAGE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </FormSelect>
    </div>
  );
}

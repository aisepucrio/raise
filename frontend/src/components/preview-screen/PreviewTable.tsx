import { useRef, type UIEvent } from "react";

import { Button } from "@/components/button";
import { Loader } from "@/components/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSortableHead,
} from "@/components/table";
import { TablePaginationFooter } from "@/components/table-pagination-footer";
import {
  formatIsoDate,
  isIsoDateString,
  resolveColumnWidth,
  toPreviewString,
  type PreviewRow,
} from "@/sources/shared/PreviewShared";

type PreviewSortState = {
  field: string;
  direction: "asc" | "desc";
} | null;

type PreviewTableProps = {
  rows: PreviewRow[];
  visibleColumns: string[];
  tableColumns: string[];
  sortState: PreviewSortState;
  onSort: (field: string) => void;
  onOpenCellPreview: (value: unknown) => void;
  isTablePending: boolean;
  emptyStateMessage: string;
  currentPage: number;
  rowsPerPage: number;
  totalItems: number;
  itemsLabel: string;
  onPageChange: (nextPage: number) => void;
  onRowsPerPageChange: (nextRowsPerPage: number) => void;
};

function resolvePreviewRowKey(row: PreviewRow, rowIndex: number) {
  const stableValue =
    row.id ??
    row._id ??
    row.uuid ??
    row.key ??
    row.node_id ??
    row.question_id ??
    row.issue_id ??
    row.comment_id ??
    row.commit_id ??
    row.sha;

  if (stableValue !== null && stableValue !== undefined && String(stableValue)) {
    return `preview-row-${String(stableValue)}`;
  }

  return `preview-row-${rowIndex}`;
}

export function PreviewTable({
  rows,
  visibleColumns,
  tableColumns,
  sortState,
  onSort,
  onOpenCellPreview,
  isTablePending,
  emptyStateMessage,
  currentPage,
  rowsPerPage,
  totalItems,
  itemsLabel,
  onPageChange,
  onRowsPerPageChange,
}: PreviewTableProps) {
  // Referência do container de cabeçalho para sincronizar scroll horizontal.
  const headerScrollRef = useRef<HTMLDivElement | null>(null);

  // Sincroniza scroll horizontal do cabeçalho com o corpo da tabela.
  function handleBodyScroll(event: UIEvent<HTMLDivElement>) {
    if (!headerScrollRef.current) return;
    headerScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-xl border-2 border-(--color-secondary-soft) p-4">
      <div className="min-h-0 flex-1 overflow-hidden">
        {isTablePending ? (
          // Estado inicial de carregamento da tabela.
          <div className="h-full">
            <Loader />
          </div>
        ) : (
          <>
            {/* Tabela em duas partes: header fixo + body com scroll vertical/horizontal. */}
            <div className="flex h-full min-h-0 flex-col">
              {/* Header da tabela (sem scroll vertical) */}
              <div
                ref={headerScrollRef}
                className="overflow-hidden border-b border-(--color-secondary-soft)"
              >
                <Table withContainer={false} className="w-full min-w-max">
                  <colgroup>
                    {tableColumns.map((column) => (
                      <col
                        key={`head-col-${column}`}
                        style={{ width: resolveColumnWidth(column) }}
                      />
                    ))}
                  </colgroup>

                  <TableHeader>
                    <TableRow>
                      {visibleColumns.length === 0 ? (
                        // Header de fallback quando todas as colunas foram ocultadas.
                        <TableHead>No columns selected</TableHead>
                      ) : (
                        // Header normal com ordenação server-side por coluna.
                        visibleColumns.map((column) => {
                          const isColumnSorted = sortState?.field === column;

                          return (
                            <TableSortableHead
                              key={`head-${column}`}
                              sortDirection={
                                isColumnSorted ? (sortState?.direction ?? null) : null
                              }
                              onSort={() => onSort(column)}
                              title={`Sort by ${column}`}
                            >
                              {column}
                            </TableSortableHead>
                          );
                        })
                      )}
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>

              {/* Body da tabela (scrollável) */}
              <div className="min-h-0 flex-1 overflow-auto" onScroll={handleBodyScroll}>
                <Table withContainer={false} className="w-full min-w-max">
                  <colgroup>
                    {tableColumns.map((column) => (
                      <col
                        key={`body-col-${column}`}
                        style={{ width: resolveColumnWidth(column) }}
                      />
                    ))}
                  </colgroup>

                  <TableBody>
                    {visibleColumns.length === 0 ? (
                      // Fallback quando nenhuma coluna está visível.
                      <TableRow>
                        <TableCell
                          colSpan={1}
                          className="py-6 text-center text-(--color-secondary-muted)"
                        >
                          Use the Columns filter to enable at least one column.
                        </TableCell>
                      </TableRow>
                    ) : rows.length === 0 ? (
                      // Empty state quando filtros não retornam dados.
                      <TableRow>
                        <TableCell
                          colSpan={Math.max(visibleColumns.length, 1)}
                          className="py-6 text-center text-(--color-secondary-muted)"
                        >
                          {emptyStateMessage}
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Linhas de dados.
                      rows.map((row, rowIndex) => (
                        <TableRow key={resolvePreviewRowKey(row, rowIndex)}>
                          {visibleColumns.map((column) => {
                            const value = row[column];
                            const isObjectLike =
                              typeof value === "object" && value !== null;
                            const rawText = toPreviewString(value);
                            const displayText =
                              typeof value === "string" && isIsoDateString(value)
                                ? formatIsoDate(value)
                                : rawText || "-";
                            const isLong = displayText.length > 100;
                            const compactText = isLong
                              ? `${displayText.slice(0, 100)}...`
                              : displayText;

                            return (
                              <TableCell key={`${rowIndex}-${column}`} className="max-w-88">
                                {isObjectLike ? (
                                  // Objetos/arrays são exibidos no modal via botão para evitar poluição na célula.
                                  <Button
                                    text="Show"
                                    fullWidth={false}
                                    variant="selectable"
                                    size="sm"
                                    onClick={() => onOpenCellPreview(value)}
                                  />
                                ) : (
                                  // Campos primitivos podem ser clicados para abrir versão completa no modal.
                                  <button
                                    type="button"
                                    className="max-w-full cursor-pointer text-left whitespace-normal wrap-break-word text-(--color-secondary) hover:underline"
                                    title={rawText}
                                    onClick={() => onOpenCellPreview(value)}
                                  >
                                    {compactText}
                                  </button>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>

      {!isTablePending ? (
        // Paginação é exibida apenas quando a tabela já carregou.
        <div className="shrink-0">
          <TablePaginationFooter
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems}
            itemsLabel={itemsLabel}
            onPageChange={(nextPage) => {
              onPageChange(nextPage);
              if (headerScrollRef.current) {
                headerScrollRef.current.scrollLeft = 0;
              }
            }}
            onRowsPerPageChange={onRowsPerPageChange}
          />
        </div>
      ) : null}
    </section>
  );
}

export type { PreviewSortState, PreviewTableProps };

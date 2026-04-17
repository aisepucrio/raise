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

export type PreviewSortState = {
  field: string;
  direction: "asc" | "desc";
} | null;

export type PreviewTableProps = {
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

// generates key stable for row.
function resolvePreviewRowKey(row: PreviewRow, rowIndex: number) {
  const [firstColumn] = Object.keys(row);
  const stableValue = firstColumn ? row[firstColumn] : undefined;

  if (
    stableValue !== null &&
    stableValue !== undefined &&
    String(stableValue)
  ) {
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
  // Header reference used to synchronize horizontal scroll.
  const headerScrollRef = useRef<HTMLDivElement | null>(null);

  // syncs scroll between body and header.
  function handleBodyScroll(event: UIEvent<HTMLDivElement>) {
    if (!headerScrollRef.current) return;
    headerScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-xl border-2 border-(--color-secondary-soft) p-4">
      <div className="min-h-0 flex-1 overflow-hidden">
        {isTablePending ? (
          // Loading state.
          <div className="h-full">
            <Loader />
          </div>
        ) : (
          <>
            {/* Header fixed + body with scroll */}
            <div className="flex h-full min-h-0 flex-col">
              {/* Header of the table */}
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
                        // Fallback when all columns are hidden.
                        <TableHead>No columns selected</TableHead>
                      ) : (
                        // Sortable header per column.
                        visibleColumns.map((column) => {
                          const isColumnSorted = sortState?.field === column;

                          return (
                            <TableSortableHead
                              key={`head-${column}`}
                              sortDirection={
                                isColumnSorted
                                  ? (sortState?.direction ?? null)
                                  : null
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

              {/* Body of the table */}
              <div
                className="min-h-0 flex-1 overflow-auto"
                onScroll={handleBodyScroll}
              >
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
                    {rows.length === 0 ? (
                      // Empty state: no data for current filters (takes priority over column state).
                      <TableRow>
                        <TableCell
                          colSpan={Math.max(visibleColumns.length, 1)}
                          className="py-6 text-center text-(--color-secondary-muted)"
                        >
                          {emptyStateMessage}
                        </TableCell>
                      </TableRow>
                    ) : visibleColumns.length === 0 ? (
                      // All columns hidden by user.
                      <TableRow>
                        <TableCell
                          colSpan={1}
                          className="py-6 text-center text-(--color-secondary-muted)"
                        >
                          Use the Columns filter to enable at least one column.
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Data rows.
                      rows.map((row, rowIndex) => (
                        <TableRow key={resolvePreviewRowKey(row, rowIndex)}>
                          {visibleColumns.map((column) => {
                            const value = row[column];
                            const isObjectLike =
                              typeof value === "object" && value !== null;
                            const rawText = toPreviewString(value);
                            const displayText =
                              typeof value === "string" &&
                              isIsoDateString(value)
                                ? formatIsoDate(value)
                                : rawText || "-";
                            const isLong = displayText.length > 100;
                            const compactText = isLong
                              ? `${displayText.slice(0, 100)}...`
                              : displayText;

                            return (
                              <TableCell
                                key={`${rowIndex}-${column}`}
                                className="max-w-88"
                              >
                                {isObjectLike ? (
                                  // Objects/arrays open in the modal.
                                  <Button
                                    text="Show"
                                    fullWidth={false}
                                    variant="selectable"
                                    size="sm"
                                    onClick={() => onOpenCellPreview(value)}
                                  />
                                ) : (
                                  // Primitive values also open in the modal.
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
        // Show pagination only after loading finishes.
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

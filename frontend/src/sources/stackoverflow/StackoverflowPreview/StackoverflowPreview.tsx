import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PreviewCellModal,
  PreviewHeader,
  PreviewTable,
  PreviewWrapper,
  type PreviewSortState,
} from "@/components/preview";
import { StartEndDateFilter } from "@/components/start-end-datefilter";
import {
  useStackOverflowExportMutation,
  useStackOverflowPreviewQuery,
  type StackOverflowPreviewParams,
  type StackOverflowSection,
} from "@/data";
import {
  isPreviewSortInvalid,
  resolvePreviewOrdering,
  resolvePreviewTableState,
  runPreviewExportWithFeedback,
  showPreviewErrorToast,
  togglePreviewSortState,
  type PreviewBuildParamsInput,
} from "@/sources/shared/PreviewShared";

export type StackoverflowPreviewProps = {
  idPrefix: string;
  previewSection: StackOverflowSection;
  itemsLabel: string;
  emptyStateMessage: string;
  loadErrorMessage: string;
  exportFileNamePrefix: string;
  exportSuccessMessage?: string;
  showDateFilters?: boolean;
};

export function StackoverflowPreview({
  idPrefix,
  previewSection,
  itemsLabel,
  emptyStateMessage,
  loadErrorMessage,
  exportFileNamePrefix,
  exportSuccessMessage = "Stack Overflow preview exported successfully.",
  showDateFilters = true,
}: StackoverflowPreviewProps) {
  // filters of the screen
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  // pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortState, setSortState] = useState<PreviewSortState>(null);

  // modal of cell
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [selectedCellValue, setSelectedCellValue] = useState<unknown>(null);

  // columns hidden
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const previewExportMutation = useStackOverflowExportMutation();

  // Traduz sort local for the field ordering used pela API.
  const ordering = useMemo(() => resolvePreviewOrdering(sortState), [sortState]);

  // filters mudaram, returns for first page.
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, search, ordering]);

  const buildPreviewParams = useCallback(
    ({
      page,
      rowsPerPage: nextRowsPerPage,
      search: searchTerm,
      ordering: orderingValue,
      dateFilters,
    }: PreviewBuildParamsInput): StackOverflowPreviewParams => ({
      // Concentra the conversion of the states of the screen in params of request.
      page,
      page_size: nextRowsPerPage,
      ...(searchTerm ? { search: searchTerm } : {}),
      ...(orderingValue ? { ordering: orderingValue } : {}),
      ...(showDateFilters && dateFilters
        ? {
            ...(dateFilters.startDate
              ? { creation_date__gte: dateFilters.startDate }
              : {}),
            ...(dateFilters.endDate
              ? { creation_date__lte: dateFilters.endDate }
              : {}),
          }
        : {}),
    }),
    [showDateFilters],
  );

  // Memoizes final params to avoid unnecessary queries.
  const previewParams = useMemo(
    () =>
      buildPreviewParams({
        page: currentPage,
        rowsPerPage,
        search,
        ordering,
        dateFilters: showDateFilters
          ? {
              startDate,
              endDate,
            }
          : undefined,
      }),
    [
      buildPreviewParams,
      currentPage,
      rowsPerPage,
      search,
      ordering,
      showDateFilters,
      startDate,
      endDate,
    ],
  );

  // search the date of the table with the filters/pagination ativos.
  const previewQuery = useStackOverflowPreviewQuery(previewSection, previewParams);
  const rows = previewQuery.data?.results ?? [];
  const totalItems = previewQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  // avoids page invalid when the total changes.
  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Deriva entires the columns visible and configuration of the table the partir of the rows.
  const { columns, visibleColumns, tableColumns } = useMemo(
    () => resolvePreviewTableState(rows, hiddenColumns),
    [rows, hiddenColumns],
  );

  // clears sort when the column some ou is hidden.
  useEffect(() => {
    if (!isPreviewSortInvalid(sortState, columns, hiddenColumns)) return;
    setSortState(null);
  }, [sortState, columns, hiddenColumns]);

  // displays error of preview.
  useEffect(() => {
    if (!previewQuery.isError) return;
    showPreviewErrorToast(previewQuery.error, loadErrorMessage);
  }, [previewQuery.isError, previewQuery.error, loadErrorMessage]);

  // Prepara the request of export deste preview.
  const requestExportPayload = useCallback(
    () => previewExportMutation.mutateAsync(),
    [previewExportMutation],
  );

  async function handleExport() {
    await runPreviewExportWithFeedback({
      execute: requestExportPayload,
      fileNamePrefix: exportFileNamePrefix,
      successMessage: exportSuccessMessage,
    });
  }

  // Alterna asc/desc of the column clieach.
  function handleSort(field: string) {
    if (!field) return;
    setSortState((currentSortState) =>
      togglePreviewSortState(currentSortState, field),
    );
  }

  // Abre modal for visualizar the content complete of the cell.
  function handleOpenCellPreview(value: unknown) {
    setSelectedCellValue(value);
    setIsCellModalOpen(true);
  }

  return (
    <PreviewWrapper>
      {/* Header fixed with actions global and filter optional of period */}
      <PreviewHeader
        idPrefix={idPrefix}
        onSearchChange={setSearch}
        columns={columns}
        hiddenColumns={hiddenColumns}
        onHiddenColumnsChange={setHiddenColumns}
        onExport={() => void handleExport()}
        isExportPending={previewExportMutation.isPending}
      >
        {/* filter optional of period */}
        {showDateFilters ? (
          <div className="shrink-0">
            <StartEndDateFilter
              idPrefix={idPrefix}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              width="compact"
            />
          </div>
        ) : null}
      </PreviewHeader>

      {/* table main with sorting, pagination and preview of cells */}
      <PreviewTable
        rows={rows}
        visibleColumns={visibleColumns}
        tableColumns={tableColumns}
        sortState={sortState}
        onSort={handleSort}
        onOpenCellPreview={handleOpenCellPreview}
        isTablePending={previewQuery.isPending}
        emptyStateMessage={emptyStateMessage}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        totalItems={totalItems}
        itemsLabel={itemsLabel}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(nextRowsPerPage) => {
          setRowsPerPage(nextRowsPerPage);
          setCurrentPage(1);
        }}
      />

      {/* Modal for display values long of cell without break layout of the table */}
      <PreviewCellModal
        open={isCellModalOpen}
        onClose={() => setIsCellModalOpen(false)}
        value={selectedCellValue}
      />
    </PreviewWrapper>
  );
}

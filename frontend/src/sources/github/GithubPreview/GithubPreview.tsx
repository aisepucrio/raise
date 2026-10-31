import { useEffect, useMemo, useState } from "react";

import {
  PreviewCellModal,
  PreviewHeader,
  PreviewTable,
  PreviewWrapper,
  type PreviewSortState,
} from "@/components/preview";
import { SourceSelectFilter } from "@/components/source-select-filter";
import { StartEndDateFilter } from "@/components/start-end-datefilter";
import { toast } from "@/components/toast";
import {
  buildDatasetExportUrl,
  mergeDateRanges,
  useDashboardDateRangeQuery,
  useDashboardQuery,
  useDatasetCatalogueQuery,
  useDatasetPreviewQuery,
  type DatasetFilters,
} from "@/data";
import { buildSelectOptions } from "@/sources/shared/AllShared";
import {
  isPreviewSortInvalid,
  resolvePreviewOrdering,
  resolvePreviewTableState,
  showPreviewErrorToast,
  togglePreviewSortState,
} from "@/sources/shared/PreviewShared";

import {
  ExportFormat,
  PreviewExportModal,
} from "@/components/preview/PreviewExportModal";

export type GithubPreviewProps = {
  idPrefix: string;
  // The Go dataset behind this section: `git` for commits, `github` otherwise.
  platform: "git" | "github";
  dataset: string;
  itemsLabel: string;
  emptyStateMessage: string;
  loadErrorMessage: string;
};

// A page of one dataset (backend-go architecture.md §9.2). Which filters
// apply comes from the dataset catalogue: the repository filter needs a
// `repository_id` column, the date filter a time column.
export function GithubPreview({
  idPrefix,
  platform,
  dataset,
  itemsLabel,
  emptyStateMessage,
  loadErrorMessage,
}: GithubPreviewProps) {
  // Screen filters.
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  // Pagination and sorting. Pages are keyset-paginated: cursors[n] fetches
  // page n + 1, and is known once page n has loaded, so pages open in order.
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortState, setSortState] = useState<PreviewSortState>(null);

  // Cell preview modal.
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [selectedCellValue, setSelectedCellValue] = useState<unknown>(null);

  // Hidden columns.
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("json");

  const catalogueQuery = useDatasetCatalogueQuery(platform);
  const datasetInfo = catalogueQuery.data?.find((d) => d.name === dataset);
  const columnInfo = useMemo(
    () => new Map(datasetInfo?.columns.map((c) => [c.name, c]) ?? []),
    [datasetInfo],
  );
  const hasRepositoryFilter = columnInfo.has("repository_id");
  const hasDateFilter = Boolean(datasetInfo?.time_column);

  // Repositories the platform's dashboard can be scoped to.
  const { data: dashboardData, isPending: isRepositoryListPending } =
    useDashboardQuery(platform);
  const repositoryOptions = useMemo(
    () => buildSelectOptions(dashboardData?.entities),
    [dashboardData?.entities],
  );

  // The dashboard's date range bounds the date picker. Its timestamp is the
  // time column of most datasets (github_created_at, authored_at).
  const dateRangeQuery = useDashboardDateRangeQuery(
    platform,
    selectedSourceId || undefined,
    { enabled: hasDateFilter },
  );
  const dateBounds = useMemo(
    () => mergeDateRanges([dateRangeQuery.data]),
    [dateRangeQuery.data],
  );

  const sort = useMemo(() => resolvePreviewOrdering(sortState), [sortState]);

  // When filters change, return to the first page; cursors only hold for
  // the filters, sort and page size they were made with.
  useEffect(() => {
    setCurrentPage(1);
    setCursors([undefined]);
  }, [selectedSourceId, startDate, endDate, search, sort, rowsPerPage]);

  // Filters shared by the preview and the export, so an export is the
  // currently filtered table.
  const filters = useMemo<DatasetFilters>(
    () => ({
      ...(search ? { search } : {}),
      ...(sort ? { sort } : {}),
      // The date inputs are inclusive; the API's until is exclusive, and
      // accepts YYYY-MM-DD as midnight UTC.
      ...(hasDateFilter && startDate ? { since: startDate } : {}),
      ...(hasDateFilter && endDate ? { until: nextDay(endDate) } : {}),
      ...(hasRepositoryFilter && selectedSourceId
        ? { columns: { repository_id: selectedSourceId } }
        : {}),
    }),
    [
      search,
      sort,
      hasDateFilter,
      startDate,
      endDate,
      hasRepositoryFilter,
      selectedSourceId,
    ],
  );

  const pageCursor = cursors[currentPage - 1];
  const previewParams = useMemo(
    () => ({
      ...filters,
      limit: rowsPerPage,
      ...(pageCursor ? { cursor: pageCursor } : {}),
    }),
    [filters, rowsPerPage, pageCursor],
  );

  // Waits for the catalogue so unsupported filters are never sent (a 422).
  const previewQuery = useDatasetPreviewQuery(
    platform,
    dataset,
    previewParams,
    {
      enabled: Boolean(datasetInfo),
    },
  );
  const rows = previewQuery.data?.results ?? [];
  const totalItems = previewQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  // Records the cursor of the page after the current one.
  const nextCursor = previewQuery.isPlaceholderData
    ? undefined
    : previewQuery.data?.next_cursor;
  useEffect(() => {
    if (!nextCursor) return;
    setCursors((current) =>
      current[currentPage] === nextCursor
        ? current
        : [...current.slice(0, currentPage), nextCursor],
    );
  }, [nextCursor, currentPage]);

  // Prevents an invalid page when the total changes. Only pages whose
  // cursor is known can be opened.
  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(Math.min(totalPages, cursors.length));
  }, [currentPage, totalPages, cursors.length]);

  // Derives visible columns and table configuration from row data.
  const { columns, visibleColumns, tableColumns } = useMemo(
    () => resolvePreviewTableState(rows, hiddenColumns),
    [rows, hiddenColumns],
  );

  // Clears sorting when the sorted column disappears or becomes hidden.
  useEffect(() => {
    if (!isPreviewSortInvalid(sortState, columns, hiddenColumns)) return;
    setSortState(null);
  }, [sortState, columns, hiddenColumns]);

  // Displays preview errors.
  const loadError = previewQuery.error ?? catalogueQuery.error;
  useEffect(() => {
    if (!loadError) return;
    showPreviewErrorToast(loadError, loadErrorMessage);
  }, [loadError, loadErrorMessage]);

  // The filters the export applies, in words, for the export dialog.
  const appliedFilters = useMemo(() => {
    const out: string[] = [];
    if (hasRepositoryFilter && selectedSourceId) {
      const name = repositoryOptions.find(
        (o) => o.value === selectedSourceId,
      )?.label;
      out.push(`Repository: ${name ?? selectedSourceId}`);
    }
    if (hasDateFilter && (startDate || endDate)) {
      const column = datasetInfo?.time_column ?? "date";
      out.push(
        startDate && endDate
          ? `${column} from ${startDate} to ${endDate}`
          : startDate
            ? `${column} from ${startDate}`
            : `${column} until ${endDate}`,
      );
    }
    if (search) out.push(`Search: "${search}"`);
    if (sortState) {
      out.push(
        `Sorted by ${sortState.field}, ${sortState.direction === "asc" ? "ascending" : "descending"}`,
      );
    }
    return out;
  }, [
    hasRepositoryFilter,
    selectedSourceId,
    repositoryOptions,
    hasDateFilter,
    startDate,
    endDate,
    datasetInfo?.time_column,
    search,
    sortState,
  ]);

  // Exports stream from the API as an attachment; a link downloads them.
  function handleConfirmExport() {
    const link = document.createElement("a");
    link.href = buildDatasetExportUrl(
      platform,
      dataset,
      selectedFormat,
      filters,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(undefined, { description: `Exporting ${itemsLabel}…` });
    setIsExportModalOpen(false);
  }

  // Toggles ascending/descending sort for the clicked column. Long text and
  // JSON columns can't be sorted.
  function handleSort(field: string) {
    if (!field) return;
    if (columnInfo.get(field)?.sortable === false) {
      toast.info(undefined, { description: `"${field}" can't be sorted.` });
      return;
    }
    setSortState((currentSortState) =>
      togglePreviewSortState(currentSortState, field),
    );
  }

  // Opens a modal to view the full cell content.
  function handleOpenCellPreview(value: unknown) {
    setSelectedCellValue(value);
    setIsCellModalOpen(true);
  }

  return (
    <PreviewWrapper>
      {/* Fixed header with global actions and source filters. */}
      <PreviewHeader
        idPrefix={idPrefix}
        onSearchChange={setSearch}
        columns={columns}
        hiddenColumns={hiddenColumns}
        onHiddenColumnsChange={setHiddenColumns}
        onExport={() => setIsExportModalOpen(true)}
        isExportPending={false}
      >
        {hasRepositoryFilter ? (
          <SourceSelectFilter
            id={`${idPrefix}-source`}
            label="Repository"
            value={selectedSourceId}
            onChange={setSelectedSourceId}
            options={repositoryOptions}
            allOptionLabel="All repositories"
            isOptionsPending={isRepositoryListPending}
            wrapperClassName="min-w-0 flex-1 xl:min-w-44"
            className="font-semibold"
          />
        ) : null}

        {hasDateFilter ? (
          <div className="shrink-0">
            <StartEndDateFilter
              idPrefix={idPrefix}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              width="compact"
              dateRange={dateBounds}
            />
          </div>
        ) : null}
      </PreviewHeader>

      {/* Main table with sorting, pagination, and cell previews. */}
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
        maxReachablePage={cursors.length}
        itemsLabel={itemsLabel}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {/* Modal that shows long cell values without breaking table layout. */}
      <PreviewCellModal
        open={isCellModalOpen}
        onClose={() => setIsCellModalOpen(false)}
        value={selectedCellValue}
      />

      <PreviewExportModal
        open={isExportModalOpen}
        selectedFormat={selectedFormat}
        onChangeFormat={setSelectedFormat}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleConfirmExport}
        rowCount={previewQuery.data?.count}
        appliedFilters={appliedFilters}
      />
    </PreviewWrapper>
  );
}

// YYYY-MM-DD of the day after `date`.
function nextDay(date: string) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

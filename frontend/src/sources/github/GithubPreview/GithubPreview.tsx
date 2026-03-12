import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PreviewCellModal,
  PreviewHeader,
  PreviewTable,
  PreviewWrapper,
  type PreviewSortState,
} from "@/components/preview";
import { SourceSelectFilter } from "@/components/source-select-filter";
import { StartEndDateFilter } from "@/components/start-end-datefilter";
import {
  useGithubDateRangeByRepositoryQuery,
  useGithubExportMutation,
  useGithubOverviewQuery,
  useGithubPreviewQuery,
  type GithubPreviewParams,
  type GithubSection,
} from "@/data";
import { buildSelectOptions } from "@/sources/shared/AllShared";
import {
  isPreviewSortInvalid,
  resolvePreviewOrdering,
  resolvePreviewTableState,
  runPreviewExportWithFeedback,
  showPreviewErrorToast,
  togglePreviewSortState,
  type PreviewBuildParamsInput,
} from "@/sources/shared/PreviewShared";

export type GithubPreviewDateFilterField = "created_at" | "date";

export type GithubPreviewProps = {
  idPrefix: string;
  previewSection: GithubSection;
  itemsLabel: string;
  emptyStateMessage: string;
  loadErrorMessage: string;
  exportTable: string;
  exportDataType?: string;
  exportFileNamePrefix: string;
  exportSuccessMessage?: string;
  dateFilterField?: GithubPreviewDateFilterField;
  showDateFilters?: boolean;
};

function buildDateFilterParams(
  dateFilterField: GithubPreviewDateFilterField,
  startDate: string,
  endDate: string,
): Partial<GithubPreviewParams> {
  // Maps the UI date field to the filters accepted by the API.
  if (dateFilterField === "created_at") {
    return {
      ...(startDate ? { github_created_at__gte: startDate } : {}),
      ...(endDate ? { github_created_at__lte: endDate } : {}),
    };
  }

  return {
    ...(startDate ? { date__gte: startDate } : {}),
    ...(endDate ? { date__lte: endDate } : {}),
  };
}

export function GithubPreview({
  idPrefix,
  previewSection,
  itemsLabel,
  emptyStateMessage,
  loadErrorMessage,
  exportTable,
  exportDataType,
  exportFileNamePrefix,
  exportSuccessMessage = "GitHub preview exported successfully.",
  dateFilterField,
  showDateFilters = true,
}: GithubPreviewProps) {
  // Screen filters.
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  // Pagination and sorting.
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortState, setSortState] = useState<PreviewSortState>(null);

  // Cell preview modal.
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [selectedCellValue, setSelectedCellValue] = useState<unknown>(null);

  // Hidden columns.
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const { data: overviewData, isPending: isRepositoryListPending } =
    useGithubOverviewQuery();
  const previewExportMutation = useGithubExportMutation();

  // Converts repositories to select options.
  const repositoryOptions = useMemo(
    () =>
      buildSelectOptions(overviewData?.repositories, {
        getValue: (repository) => repository.id,
        getLabel: (repository) => repository.repository,
      }),
    [overviewData?.repositories],
  );

  // Fetches the selected repository date range to constrain the date picker.
  const dateRangeQuery = useGithubDateRangeByRepositoryQuery(
    selectedSourceId || undefined,
    {
      enabled: showDateFilters,
    },
  );

  // Maps local sort state to the API ordering field.
  const ordering = useMemo(
    () => resolvePreviewOrdering(sortState),
    [sortState],
  );

  // When filters change, return to the first page.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSourceId, startDate, endDate, search, ordering]);

  // Builds request parameters from UI state.
  const buildPreviewParams = useCallback(
    ({
      page,
      rowsPerPage: nextRowsPerPage,
      selectedSourceId: nextSelectedSourceId,
      search: searchTerm,
      ordering: orderingValue,
      dateFilters,
    }: PreviewBuildParamsInput): GithubPreviewParams => ({
      // Centralizes screen-state conversion into request parameters.
      page,
      page_size: nextRowsPerPage,
      ...(nextSelectedSourceId ? { repository: nextSelectedSourceId } : {}),
      ...(searchTerm ? { search: searchTerm } : {}),
      ...(orderingValue ? { ordering: orderingValue } : {}),
      ...(showDateFilters && dateFilterField && dateFilters
        ? buildDateFilterParams(
            dateFilterField,
            dateFilters.startDate,
            dateFilters.endDate,
          )
        : {}),
    }),
    [showDateFilters, dateFilterField],
  );

  // Memoizes final params to avoid unnecessary queries.
  const previewParams = useMemo(
    () =>
      buildPreviewParams({
        page: currentPage,
        rowsPerPage,
        selectedSourceId,
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
      selectedSourceId,
      search,
      ordering,
      showDateFilters,
      startDate,
      endDate,
    ],
  );

  // Fetches table data using current filters and pagination.
  const previewQuery = useGithubPreviewQuery(previewSection, previewParams);
  const rows = previewQuery.data?.results ?? [];
  const totalItems = previewQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  // Prevents an invalid page when the total changes.
  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
  useEffect(() => {
    if (!previewQuery.isError) return;
    showPreviewErrorToast(previewQuery.error, loadErrorMessage);
  }, [previewQuery.isError, previewQuery.error, loadErrorMessage]);

  // Builds the GitHub export payload with table and data-type options.
  const requestExportPayload = useCallback(
    () =>
      previewExportMutation.mutateAsync({
        format: "json",
        table: exportTable,
        ...(exportDataType ? { date_type: exportDataType } : {}),
      }),
    [previewExportMutation, exportTable, exportDataType],
  );

  async function handleExport() {
    await runPreviewExportWithFeedback({
      execute: requestExportPayload,
      fileNamePrefix: exportFileNamePrefix,
      successMessage: exportSuccessMessage,
    });
  }

  // Toggles ascending/descending sort for the clicked column.
  function handleSort(field: string) {
    if (!field) return;
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
        onExport={() => void handleExport()}
        isExportPending={previewExportMutation.isPending}
      >
        {/* GitHub-specific filters. */}
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

        {showDateFilters ? (
          <div className="shrink-0">
            <StartEndDateFilter
              idPrefix={idPrefix}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              width="compact"
              dateRange={dateRangeQuery.data}
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
        itemsLabel={itemsLabel}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(nextRowsPerPage) => {
          setRowsPerPage(nextRowsPerPage);
          setCurrentPage(1);
        }}
      />

      {/* Modal that shows long cell values without breaking table layout. */}
      <PreviewCellModal
        open={isCellModalOpen}
        onClose={() => setIsCellModalOpen(false)}
        value={selectedCellValue}
      />
    </PreviewWrapper>
  );
}

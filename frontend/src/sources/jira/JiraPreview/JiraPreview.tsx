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
  useJiraDateRangeByProjectQuery,
  useJiraExportMutation,
  useJiraOverviewQuery,
  useJiraPreviewQuery,
  type JiraPreviewParams,
  type JiraSection,
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

export type JiraPreviewDateFilterField = "created" | "updated_at" | "sprint";

export type JiraPreviewProps = {
  idPrefix: string;
  previewSection: JiraSection;
  itemsLabel: string;
  emptyStateMessage: string;
  loadErrorMessage: string;
  exportFileNamePrefix: string;
  exportSuccessMessage?: string;
  dateFilterField?: JiraPreviewDateFilterField;
  showDateFilters?: boolean;
};

function buildDateFilterParams(
  dateFilterField: JiraPreviewDateFilterField,
  startDate: string,
  endDate: string,
): Partial<JiraPreviewParams> {
  // maps the field of date of the UI for the filters aceitos pela API.
  if (dateFilterField === "sprint") {
    return {
      ...(startDate ? { startDate__gte: startDate } : {}),
      ...(endDate ? { endDate__lte: endDate } : {}),
    };
  }

  if (dateFilterField === "updated_at") {
    return {
      ...(startDate ? { updated_at__gte: startDate } : {}),
      ...(endDate ? { updated_at__lte: endDate } : {}),
    };
  }

  return {
    ...(startDate ? { created__gte: startDate } : {}),
    ...(endDate ? { created__lte: endDate } : {}),
  };
}

export function JiraPreview({
  idPrefix,
  previewSection,
  itemsLabel,
  emptyStateMessage,
  loadErrorMessage,
  exportFileNamePrefix,
  exportSuccessMessage = "Jira preview exported successfully.",
  dateFilterField,
  showDateFilters = true,
}: JiraPreviewProps) {
  // filters of the screen
  const [selectedSourceId, setSelectedSourceId] = useState("");
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

  const { data: overviewData, isPending: isProjectListPending } =
    useJiraOverviewQuery();
  const previewExportMutation = useJiraExportMutation();

  // converts projects of the overview for the format of the select.
  const projectOptions = useMemo(
    () =>
      buildSelectOptions(overviewData?.projects, {
        getValue: (project) => project.name,
        getLabel: (project) => project.name,
      }),
    [overviewData?.projects],
  );

  // search interval of dates of the project selected for limitar the date picker.
  const dateRangeQuery = useJiraDateRangeByProjectQuery(
    selectedSourceId || undefined,
    {
      enabled: showDateFilters,
    },
  );

  // Traduz sort local for the field ordering used pela API.
  const ordering = useMemo(() => resolvePreviewOrdering(sortState), [sortState]);

  // filters mudaram, returns for first page.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSourceId, startDate, endDate, search, ordering]);

  const buildPreviewParams = useCallback(
    ({
      page,
      rowsPerPage: nextRowsPerPage,
      selectedSourceId: nextSelectedSourceId,
      search: searchTerm,
      ordering: orderingValue,
      dateFilters,
    }: PreviewBuildParamsInput): JiraPreviewParams => ({
      // Concentra the conversion of the states of the screen in params of request.
      page,
      page_size: nextRowsPerPage,
      ...(nextSelectedSourceId ? { project: nextSelectedSourceId } : {}),
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

  // search the date of the table with the filters/pagination ativos.
  const previewQuery = useJiraPreviewQuery(previewSection, previewParams);
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
      {/* Header fixed with actions global and filters of the source */}
      <PreviewHeader
        idPrefix={idPrefix}
        onSearchChange={setSearch}
        columns={columns}
        hiddenColumns={hiddenColumns}
        onHiddenColumnsChange={setHiddenColumns}
        onExport={() => void handleExport()}
        isExportPending={previewExportMutation.isPending}
      >
        {/* filters specific of the Jira */}
        <SourceSelectFilter
          id={`${idPrefix}-source`}
          label="Project"
          value={selectedSourceId}
          onChange={setSelectedSourceId}
          options={projectOptions}
          allOptionLabel="All projects"
          isOptionsPending={isProjectListPending}
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

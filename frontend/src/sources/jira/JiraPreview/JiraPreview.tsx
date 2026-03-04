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
  // Mapeia o campo de data da UI para os filtros aceitos pela API.
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
  // filtros da tela
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  // paginação e ordenação
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortState, setSortState] = useState<PreviewSortState>(null);

  // modal de célula
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [selectedCellValue, setSelectedCellValue] = useState<unknown>(null);

  // colunas ocultas
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const { data: overviewData, isPending: isProjectListPending } =
    useJiraOverviewQuery();
  const previewExportMutation = useJiraExportMutation();

  // Converte projects do overview para o formato do select.
  const projectOptions = useMemo(
    () =>
      buildSelectOptions(overviewData?.projects, {
        getValue: (project) => project.name,
        getLabel: (project) => project.name,
      }),
    [overviewData?.projects],
  );

  // Busca intervalo de datas do project selecionado para limitar o date picker.
  const dateRangeQuery = useJiraDateRangeByProjectQuery(
    selectedSourceId || undefined,
    {
      enabled: showDateFilters,
    },
  );

  // Traduz sort local para o campo ordering usado pela API.
  const ordering = useMemo(() => resolvePreviewOrdering(sortState), [sortState]);

  // filtros mudaram, volta para primeira página.
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
      // Concentra a conversão dos estados da tela em params de request.
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

  // Memoiza os params finais para evitar novas queries sem mudança real.
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

  // Busca os dados da tabela com os filtros/paginação ativos.
  const previewQuery = useJiraPreviewQuery(previewSection, previewParams);
  const rows = previewQuery.data?.results ?? [];
  const totalItems = previewQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  // evita página inválida quando o total muda.
  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Deriva todas as colunas visíveis e configuração da tabela a partir dos rows.
  const { columns, visibleColumns, tableColumns } = useMemo(
    () => resolvePreviewTableState(rows, hiddenColumns),
    [rows, hiddenColumns],
  );

  // limpa sort quando a coluna some ou é ocultada.
  useEffect(() => {
    if (!isPreviewSortInvalid(sortState, columns, hiddenColumns)) return;
    setSortState(null);
  }, [sortState, columns, hiddenColumns]);

  // Exibe erro de preview.
  useEffect(() => {
    if (!previewQuery.isError) return;
    showPreviewErrorToast(previewQuery.error, loadErrorMessage);
  }, [previewQuery.isError, previewQuery.error, loadErrorMessage]);

  // Prepara a request de export deste preview.
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

  // Alterna asc/desc da coluna clicada.
  function handleSort(field: string) {
    if (!field) return;
    setSortState((currentSortState) =>
      togglePreviewSortState(currentSortState, field),
    );
  }

  // Abre modal para visualizar o conteúdo completo da célula.
  function handleOpenCellPreview(value: unknown) {
    setSelectedCellValue(value);
    setIsCellModalOpen(true);
  }

  return (
    <PreviewWrapper>
      {/* Header fixo com ações globais e filtros do source */}
      <PreviewHeader
        idPrefix={idPrefix}
        onSearchChange={setSearch}
        columns={columns}
        hiddenColumns={hiddenColumns}
        onHiddenColumnsChange={setHiddenColumns}
        onExport={() => void handleExport()}
        isExportPending={previewExportMutation.isPending}
      >
        {/* Filtros específicos do Jira */}
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

      {/* Tabela principal com ordenação, paginação e preview de células */}
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

      {/* Modal para exibir valores longos de célula sem quebrar layout da tabela */}
      <PreviewCellModal
        open={isCellModalOpen}
        onClose={() => setIsCellModalOpen(false)}
        value={selectedCellValue}
      />
    </PreviewWrapper>
  );
}

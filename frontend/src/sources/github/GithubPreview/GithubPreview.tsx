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
  // Mapeia o campo de data da UI para os filtros aceitos pela API.
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

  const { data: overviewData, isPending: isRepositoryListPending } =
    useGithubOverviewQuery();
  const previewExportMutation = useGithubExportMutation();

  // Converte repositories para o formato do select.
  const repositoryOptions = useMemo(
    () =>
      buildSelectOptions(overviewData?.repositories, {
        getValue: (repository) => repository.id,
        getLabel: (repository) => repository.repository,
      }),
    [overviewData?.repositories],
  );

  // Busca intervalo de datas da repository selecionada para limitar o date picker.
  const dateRangeQuery = useGithubDateRangeByRepositoryQuery(
    selectedSourceId || undefined,
    {
      enabled: showDateFilters,
    },
  );

  // Traduz sort local para o campo ordering usado pela API.
  const ordering = useMemo(
    () => resolvePreviewOrdering(sortState),
    [sortState],
  );

  // filtros mudaram, volta para primeira página.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSourceId, startDate, endDate, search, ordering]);

  // Faz a construção dos params de request a partir dos estados da UI.
  const buildPreviewParams = useCallback(
    ({
      page,
      rowsPerPage: nextRowsPerPage,
      selectedSourceId: nextSelectedSourceId,
      search: searchTerm,
      ordering: orderingValue,
      dateFilters,
    }: PreviewBuildParamsInput): GithubPreviewParams => ({
      // Concentra a conversão dos estados da tela em params de request.
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
  const previewQuery = useGithubPreviewQuery(previewSection, previewParams);
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

  // Monta o payload de export do GitHub com opções de tabela e tipo.
  const requestExportPayload = useCallback(
    () =>
      previewExportMutation.mutateAsync({
        format: "json",
        table: exportTable,
        ...(exportDataType ? { data_type: exportDataType } : {}),
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
        {/* Filtros específicos do GitHub */}
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

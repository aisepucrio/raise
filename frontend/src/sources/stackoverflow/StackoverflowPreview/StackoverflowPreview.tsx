import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PreviewCellModal,
  PreviewHeader,
  PreviewTable,
  PreviewWrapper,
  type PreviewSortState,
} from "@/components/preview";
import { StartEndDateFilter } from "@/components/start-end-datefilter";
import type { StackOverflowSection } from "@/data/api/endpoints";
import { useStackOverflowExportMutation } from "@/data/modules/stackoverflow/stackoverflowMutations";
import { useStackOverflowPreviewQuery } from "@/data/modules/stackoverflow/stackoverflowQueries";
import type { StackOverflowPreviewParams } from "@/data/modules/stackoverflow/stackoverflowService";
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
  // filtros da tela
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

  const previewExportMutation = useStackOverflowExportMutation();

  // Traduz sort local para o campo ordering usado pela API.
  const ordering = useMemo(() => resolvePreviewOrdering(sortState), [sortState]);

  // filtros mudaram, volta para primeira página.
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
      // Concentra a conversão dos estados da tela em params de request.
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

  // Memoiza os params finais para evitar novas queries sem mudança real.
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

  // Busca os dados da tabela com os filtros/paginação ativos.
  const previewQuery = useStackOverflowPreviewQuery(previewSection, previewParams);
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
      {/* Header fixo com ações globais e filtro opcional de período */}
      <PreviewHeader
        idPrefix={idPrefix}
        onSearchChange={setSearch}
        columns={columns}
        hiddenColumns={hiddenColumns}
        onHiddenColumnsChange={setHiddenColumns}
        onExport={() => void handleExport()}
        isExportPending={previewExportMutation.isPending}
      >
        {/* Filtro opcional de período */}
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

import { useEffect, useMemo, useState } from "react";

import { CodePreviewModal } from "@/components/code-preview-modal";
import { toast } from "@/components/toast";
import { getQueryErrorMessage } from "@/data";
import {
  downloadPreviewExportFile,
  type PreviewRow,
} from "@/sources/shared/PreviewShared";
import { PreviewHeader, type PreviewSourceOption } from "./PreviewHeader";
import { PreviewTable, type PreviewSortState } from "./PreviewTable";

type PreviewScreenBaseParams = {
  page: number;
  page_size: number;
  search?: string;
  ordering?: string;
};

type PreviewScreenDateRange = {
  minDate?: string;
  maxDate?: string;
};

type PreviewScreenDateFilters = {
  startDate: string;
  endDate: string;
};

type PreviewScreenBuildParamsInput = {
  page: number;
  rowsPerPage: number;
  selectedSourceId: string;
  search: string;
  ordering?: string;
  dateFilters?: PreviewScreenDateFilters;
};

type PreviewScreenProps<
  TPreviewParams extends PreviewScreenBaseParams,
  TSection extends string = string,
> = {
  idPrefix: string;
  previewSection: TSection;
  sourceFilterLabel?: string;
  allSourcesOptionLabel?: string;
  sourceOptions?: PreviewSourceOption[];
  isSourceListPending?: boolean;
  itemsLabel: string;
  emptyStateMessage: string;
  loadErrorMessage: string;
  exportFileNamePrefix: string;
  exportSuccessMessage?: string;
  showSourceFilter?: boolean;
  showDateFilters?: boolean;
  useDateRangeBySourceQuery?: (
    sourceId?: string,
    options?: { enabled?: boolean },
  ) => {
    data?: PreviewScreenDateRange;
  };
  usePreviewBySourceQuery: (section: TSection, params: TPreviewParams) => {
    data?: {
      count?: number;
      results?: PreviewRow[];
    };
    isPending: boolean;
    isError: boolean;
    error: unknown;
  };
  buildPreviewParams: (
    input: PreviewScreenBuildParamsInput,
  ) => TPreviewParams;
  requestExportPayload: () => Promise<unknown>;
  isExportPending: boolean;
};

export function PreviewScreen<
  TPreviewParams extends PreviewScreenBaseParams,
  TSection extends string = string,
>({
  idPrefix,
  previewSection,
  sourceFilterLabel = "Source",
  allSourcesOptionLabel = "All sources",
  sourceOptions = [],
  isSourceListPending = false,
  itemsLabel,
  emptyStateMessage,
  loadErrorMessage,
  exportFileNamePrefix,
  exportSuccessMessage = "Preview exported successfully.",
  showSourceFilter = true,
  showDateFilters = true,
  useDateRangeBySourceQuery,
  usePreviewBySourceQuery,
  buildPreviewParams,
  requestExportPayload,
  isExportPending,
}: PreviewScreenProps<TPreviewParams, TSection>) {
  const [previewErrorMessage, setPreviewErrorMessage] = useState("");

  // Estado para filtro principal (repositório/projeto)
  const [selectedSourceId, setSelectedSourceId] = useState("");

  // Estado para filtros de data
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Estado para filtro de busca
  const [search, setSearch] = useState("");

  // Estados para paginação (e ordenação de colunas)
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortState, setSortState] = useState<PreviewSortState>(null);

  // Estado para controlar o modal de "show" (CodePreviewModal) e o valor selecionado para exibição nele.
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCellValue, setSelectedCellValue] = useState<unknown>(null);

  // Estado para colunas ocultas via ColumnVisibilityFilter.
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  // Garante que o ID selecionado seja limpo quando o filtro principal estiver oculto.
  useEffect(() => {
    if (!showSourceFilter && selectedSourceId) {
      setSelectedSourceId("");
    }
  }, [showSourceFilter, selectedSourceId]);

  const dateRangeQuery = useDateRangeBySourceQuery
    ? useDateRangeBySourceQuery(selectedSourceId || undefined, {
        enabled: showDateFilters && showSourceFilter,
      })
    : { data: undefined };

  // Query param de ordenação (server-side).
  const ordering = useMemo(() => {
    if (!sortState?.field) return undefined;
    return sortState.direction === "asc"
      ? sortState.field
      : `-${sortState.field}`;
  }, [sortState]);

  // Sempre volta para página 1 quando filtros/ordenação mudam.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSourceId, startDate, endDate, search, ordering]);

  // Monta o payload da query de preview baseado nos estados de filtros, paginação e ordenação.
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

  const previewQuery = usePreviewBySourceQuery(previewSection, previewParams);
  const previewData = previewQuery.data;

  // Pega as linhas
  const rows = previewData?.results ?? [];

  // Total de itens para paginação é baseado no count retornado pela API.
  const totalItems = previewData?.count ?? 0;

  // Calcula total de páginas baseado no total de itens e no rowsPerPage selecionado.
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  // Evita página inválida quando total de itens muda.
  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Colunas dinâmicas baseadas no payload retornado na página atual.
  const columns = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => keys.add(key));
    });
    return Array.from(keys);
  }, [rows]);
  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumns.includes(column)),
    [columns, hiddenColumns],
  );
  const tableColumns = useMemo(
    () => (visibleColumns.length > 0 ? visibleColumns : ["_fallback"]),
    [visibleColumns],
  );

  // Limpa ordenação quando a coluna deixa de existir/ficar visível.
  useEffect(() => {
    if (!sortState) return;
    if (columns.length === 0) return;
    const isSortFieldInvalid =
      !columns.includes(sortState.field) ||
      hiddenColumns.includes(sortState.field);
    if (isSortFieldInvalid) {
      setSortState(null);
    }
  }, [sortState, columns, hiddenColumns]);

  const isTablePending = previewQuery.isPending;

  // Captura erro da query para exibir feedback.
  useEffect(() => {
    if (!previewQuery.isError) return;

    setPreviewErrorMessage(
      getQueryErrorMessage(previewQuery.error, loadErrorMessage),
    );
  }, [previewQuery.isError, previewQuery.error, loadErrorMessage]);

  // Mostra o erro e limpa o estado logo em seguida.
  useEffect(() => {
    if (!previewErrorMessage) return;

    toast.error(undefined, {
      description: previewErrorMessage,
    });
    setPreviewErrorMessage("");
  }, [previewErrorMessage]);

  // Exporta o preview atual em JSON via endpoint de export.
  async function handleExport() {
    try {
      const exportPayload = await requestExportPayload();
      downloadPreviewExportFile({
        exportPayload,
        fileNamePrefix: exportFileNamePrefix,
      });

      toast.success(undefined, {
        description: exportSuccessMessage,
      });
    } catch (error) {
      toast.error(undefined, {
        description: getQueryErrorMessage(error, "Failed to export preview."),
      });
    }
  }

  // Processa mudança no sort para atualizar o estado de ordenação (sortState) e disparar nova query.
  function handleSort(field: string) {
    if (!field) return;

    setSortState((currentState) => {
      if (!currentState || currentState.field !== field) {
        return { field, direction: "asc" };
      }

      return {
        field,
        direction: currentState.direction === "asc" ? "desc" : "asc",
      };
    });
  }

  // Abre o modal de preview completo da célula ao clicar em "Show" ou no valor da célula.
  function openCellPreview(value: unknown) {
    setSelectedCellValue(value);
    setModalOpen(true);
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 rounded-xl bg-(--color-primary) p-4">
      {/* ====== HEADER - Barra superior: filtros e ações ====== */}
      <PreviewHeader
        idPrefix={idPrefix}
        sourceFilterLabel={sourceFilterLabel}
        selectedSourceId={selectedSourceId}
        onSelectedSourceIdChange={setSelectedSourceId}
        sourceOptions={sourceOptions}
        allSourcesOptionLabel={allSourcesOptionLabel}
        isSourceListPending={isSourceListPending}
        showSourceFilter={showSourceFilter}
        showDateFilters={showDateFilters}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        dateRange={showDateFilters ? dateRangeQuery.data : undefined}
        onSearchChange={setSearch}
        columns={columns}
        hiddenColumns={hiddenColumns}
        onHiddenColumnsChange={setHiddenColumns}
        onExport={() => void handleExport()}
        isExportPending={isExportPending}
      />

      {/* ===== TABLE (tabela) ===== */}
      <PreviewTable
        rows={rows}
        visibleColumns={visibleColumns}
        tableColumns={tableColumns}
        sortState={sortState}
        onSort={handleSort}
        onOpenCellPreview={openCellPreview}
        isTablePending={isTablePending}
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

      {/* Modal de inspeção de célula */}
      <CodePreviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        value={selectedCellValue}
      />
    </section>
  );
}

export type {
  PreviewScreenBaseParams,
  PreviewScreenBuildParamsInput,
  PreviewScreenDateFilters,
  PreviewScreenDateRange,
  PreviewScreenProps,
};

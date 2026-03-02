import { useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/button";
import { ColumnVisibilityFilter } from "@/components/column-visibility-filter";
import { CodePreviewModal } from "@/components/code-preview-modal";
import {
  isDateOutsideRange,
  resolveDateBound,
} from "@/components/format-date-item";
import { FormDateSelector, FormSelect } from "@/components/form";
import { Loader } from "@/components/loader";
import { SearchBar } from "@/components/search-bar";
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
import { toast } from "@/components/toast";
import type { GithubSection } from "@/data/api/endpoints";
import { getQueryErrorMessage } from "@/data";
import { useGithubExportMutation } from "@/data/modules/github/githubMutations";
import {
  useGithubDateRangeByRepositoryQuery,
  useGithubOverviewQuery,
  useGithubPreviewQuery,
} from "@/data/modules/github/githubQueries";
import type { GithubPreviewParams } from "@/data/modules/github/githubService";
import { toDateInputValue } from "@/sources/shared/OverviewShared";
import { buildSelectOptions } from "@/sources/shared/AllShared";
import {
  downloadPreviewExportFile,
  formatIsoDate,
  isIsoDateString,
  resolveColumnWidth,
  toPreviewString,
} from "@/sources/shared/PreviewShared";

type GithubPreviewDateFilterField = "created_at" | "date";

type GithubPreviewProps = {
  idPrefix: string;
  previewSection: GithubSection;
  itemsLabel: string;
  emptyStateMessage: string;
  loadErrorMessage: string;
  exportTable: string;
  exportDataType?: string;
  exportFileNamePrefix: string;
  exportSuccessMessage?: string;
  dateFilterField: GithubPreviewDateFilterField;
};

function buildDateFilterParams(
  dateFilterField: GithubPreviewDateFilterField,
  startDate: string,
  endDate: string,
): Partial<GithubPreviewParams> {
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
}: GithubPreviewProps) {
  // Queries e actions da tela.
  const { data: overviewData, isPending: isRepositoryListPending } =
    useGithubOverviewQuery();
  const previewExportMutation = useGithubExportMutation();

  // Estado para repositório selecionado
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");

  // Estado para filtros de data
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Estado para filtro de busca
  const [search, setSearch] = useState("");

  // Estados para paginação (e ordenação de colunas)
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortState, setSortState] = useState<{
    field: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Estado para controlar o modal de "show" (CodePreviewModal) e o valor selecionado para exibição nele.
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCellValue, setSelectedCellValue] = useState<unknown>(null);

  // Estado para colunas ocultas via ColumnVisibilityFilter.
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  // Referência do container de cabeçalho para sincronizar scroll horizontal.
  const headerScrollRef = useRef<HTMLDivElement | null>(null);

  // Opções do select de repositórios no formato padrão do FormSelect.
  const repositoryOptions = useMemo(
    () =>
      buildSelectOptions(overviewData?.repositories, {
        getValue: (repository) => repository.id,
        getLabel: (repository) => repository.repository,
      }),
    [overviewData?.repositories],
  );

  const dateRangeQuery = useGithubDateRangeByRepositoryQuery(
    selectedRepositoryId || undefined,
  );

  const minDate = toDateInputValue(dateRangeQuery.data?.minDate);
  const maxDate = toDateInputValue(dateRangeQuery.data?.maxDate);
  const startDateMax = resolveDateBound([maxDate, endDate], "min");
  const endDateMin = resolveDateBound([minDate, startDate], "max");

  // Query param de ordenação (server-side).
  const ordering = useMemo(() => {
    if (!sortState?.field) return undefined;
    return sortState.direction === "asc"
      ? sortState.field
      : `-${sortState.field}`;
  }, [sortState]);

  // Params de data para a query de preview variam conforme a section.
  const dateFilterParams = useMemo(
    () => buildDateFilterParams(dateFilterField, startDate, endDate),
    [dateFilterField, startDate, endDate],
  );

  // Sempre volta para página 1 quando filtros/ordenação mudam.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRepositoryId, startDate, endDate, search, ordering]);

  // Ao trocar o repositório, limpa datas que ficarem fora da faixa disponível.
  useEffect(() => {
    if (!selectedRepositoryId) return;

    setStartDate((currentStartDate) =>
      isDateOutsideRange(currentStartDate, minDate, maxDate)
        ? ""
        : currentStartDate,
    );
    setEndDate((currentEndDate) =>
      isDateOutsideRange(currentEndDate, minDate, maxDate) ? "" : currentEndDate,
    );
  }, [selectedRepositoryId, minDate, maxDate]);

  // Monta o payload da query de preview baseado nos estados de filtros, paginação e ordenação.
  const previewQuery = useGithubPreviewQuery(previewSection, {
    page: currentPage,
    page_size: rowsPerPage,
    ...(selectedRepositoryId
      ? {
          repository: selectedRepositoryId,
        }
      : {}),
    ...(search ? { search } : {}),
    ...(ordering ? { ordering } : {}),
    ...dateFilterParams,
  });

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

  const previewErrorMessage = previewQuery.isError
    ? getQueryErrorMessage(previewQuery.error, loadErrorMessage)
    : null;
  const isTablePending = previewQuery.isPending;

  // Exporta o preview atual em JSON via endpoint de export.
  async function handleExport() {
    try {
      const exportPayload = await previewExportMutation.mutateAsync({
        format: "json",
        table: exportTable,
        ...(exportDataType ? { data_type: exportDataType } : {}),
      });
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

  // Sincroniza scroll horizontal do cabeçalho com o corpo da tabela.
  function handleBodyScroll(event: UIEvent<HTMLDivElement>) {
    if (!headerScrollRef.current) return;
    headerScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 rounded-xl bg-(--color-primary) p-4">
      {/* ====== HEADER - Barra superior: filtros e ações ====== */}
      <section className="shrink-0 space-y-3">
        <div className="grid grid-cols-2 gap-2 overflow-visible pb-1 md:items-end md:grid-cols-[minmax(0,1fr)_11.5rem_11.5rem] xl:grid-cols-[minmax(0,1fr)_11.5rem_11.5rem_max-content_auto_auto]">
          {/* Filtro de repositório */}
          <div className="col-span-2 min-w-0 md:col-span-1">
            <FormSelect
              id={`${idPrefix}-repository`}
              label="Repository"
              value={selectedRepositoryId}
              onChange={(event) => setSelectedRepositoryId(event.target.value)}
              wrapperClassName="min-w-0"
              className="font-semibold"
              disabled={
                isRepositoryListPending && repositoryOptions.length === 0
              }
            >
              <option value="">All repositories</option>
              {repositoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormSelect>
          </div>

          {/* Filtro de data inicial */}
          <div className="min-w-0 md:min-w-46">
            <FormDateSelector
              id={`${idPrefix}-start-date`}
              label="Start"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              min={minDate}
              max={startDateMax}
              wrapperClassName="min-w-0"
            />
          </div>

          {/* Filtro de data final */}
          <div className="min-w-0 md:min-w-46">
            <FormDateSelector
              id={`${idPrefix}-end-date`}
              label="End"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              min={endDateMin}
              max={maxDate}
              wrapperClassName="min-w-0"
            />
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-2 md:col-span-3 md:grid-cols-[minmax(0,1fr)_auto_auto] xl:contents">
            {/* Busca textual (expandível) */}
            <div className="col-span-2 min-w-0 md:col-span-1">
              <SearchBar
                id={`${idPrefix}-search`}
                onSearchChange={setSearch}
                expandable
              />
            </div>

            {/* (Botão de filtro) Controle de visibilidade de colunas */}
            <ColumnVisibilityFilter
              className="self-end"
              buttonClassName="h-11 min-h-11 w-full px-3.5 py-0 md:w-auto"
              columns={columns}
              hiddenColumns={hiddenColumns}
              onHiddenColumnsChange={setHiddenColumns}
            />

            {/* Ação de exportação */}
            <div className="self-end">
              <Button
                text={
                  previewExportMutation.isPending ? "Exporting..." : "Export"
                }
                icon={<Download />}
                fullWidth={false}
                className="h-11 min-h-11 w-full px-3.5 py-0 md:w-auto"
                onClick={() => void handleExport()}
                disabled={previewExportMutation.isPending}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== TABLE (tabela) ===== */}
      <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-xl border-2 border-(--color-secondary-soft) p-4">
        {/* Mensagem de erro da query de preview */}
        {previewErrorMessage ? (
          <p className="shrink-0 rounded-md border border-(--color-red) bg-[color-mix(in_srgb,var(--color-red)_10%,var(--color-primary))] px-3 py-2 text-sm text-(--color-red)">
            {previewErrorMessage}
          </p>
        ) : null}

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
                                  isColumnSorted
                                    ? (sortState?.direction ?? null)
                                    : null
                                }
                                onSort={() => handleSort(column)}
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
                      {visibleColumns.length === 0 ? (
                        // Fallback quando nenhuma coluna está visível.
                        <TableRow>
                          <TableCell
                            colSpan={1}
                            className="py-6 text-center text-(--color-secondary-muted)"
                          >
                            Use the Columns filter to enable at least one
                            column.
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
                          <TableRow key={`preview-row-${rowIndex}`}>
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
                                    // Objetos/arrays são exibidos no modal via botão para evitar poluição na célula.
                                    <Button
                                      text="Show"
                                      fullWidth={false}
                                      variant="selectable"
                                      size="sm"
                                      onClick={() => openCellPreview(value)}
                                    />
                                  ) : (
                                    // Campos primitivos podem ser clicados para abrir versão completa no modal.
                                    <button
                                      type="button"
                                      className="max-w-full cursor-pointer text-left whitespace-normal wrap-break-word text-(--color-secondary) hover:underline"
                                      title={rawText}
                                      onClick={() => openCellPreview(value)}
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
                setCurrentPage(nextPage);
                if (headerScrollRef.current) {
                  headerScrollRef.current.scrollLeft = 0;
                }
              }}
              onRowsPerPageChange={(nextRowsPerPage) => {
                setRowsPerPage(nextRowsPerPage);
                setCurrentPage(1);
              }}
            />
          </div>
        ) : null}
      </section>

      {/* Modal de inspeção de célula */}
      <CodePreviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        value={selectedCellValue}
      />
    </section>
  );
}

export type { GithubPreviewDateFilterField, GithubPreviewProps };

import { Download } from "lucide-react";

import { Button } from "@/components/button";
import { ColumnVisibilityFilter } from "@/components/column-visibility-filter";
import { resolveDateBound } from "@/components/format-date-item";
import { FormDateSelector, FormSelect } from "@/components/form";
import { SearchBar } from "@/components/search-bar";

type PreviewSourceOption = {
  value: string;
  label: string;
};

// Variantes para o layout de header, que pode ter ou não ter filtro de data e ter ou não ter filtro de fonte.
type PreviewHeaderLayoutVariant =
  | "source-date"
  | "source-no-date"
  | "no-source-date"
  | "no-source-no-date";

// Classes de grid para o container do header, dependendo da variante de layout.
const HEADER_GRID_CLASS_BY_VARIANT: Record<PreviewHeaderLayoutVariant, string> =
  {
    "source-date":
      "grid grid-cols-2 gap-3 overflow-visible pb-1 md:items-end md:grid-cols-[minmax(0,1fr)_11.5rem_11.5rem] xl:grid-cols-[minmax(0,1fr)_11.5rem_11.5rem_max-content_auto_auto]",
    "source-no-date":
      "grid grid-cols-2 gap-3 overflow-visible pb-1 md:items-end md:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_max-content_auto_auto]",
    "no-source-date":
      "grid grid-cols-2 gap-3 overflow-visible pb-1 md:items-end md:grid-cols-[11.5rem_11.5rem] xl:grid-cols-[11.5rem_11.5rem_minmax(0,1fr)_max-content_auto_auto]",
    "no-source-no-date":
      "grid grid-cols-2 gap-3 overflow-visible pb-1 md:items-end md:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_max-content_auto_auto]",
  };

// Classes de grid para o container das ações (barra de busca, controle de colunas e exportação).
const ACTIONS_GRID_CLASS_BY_VARIANT: Record<
  PreviewHeaderLayoutVariant,
  string
> = {
  "source-date":
    "col-span-2 grid grid-cols-2 gap-3 md:col-span-3 md:grid-cols-[minmax(0,1fr)_auto_auto] xl:contents",
  "source-no-date":
    "col-span-2 grid grid-cols-2 gap-3 md:col-span-1 md:grid-cols-[minmax(0,1fr)_auto_auto] xl:contents",
  "no-source-date":
    "col-span-2 grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-[minmax(0,1fr)_auto_auto] xl:contents",
  "no-source-no-date":
    "col-span-2 grid grid-cols-2 gap-3 md:col-span-1 md:grid-cols-[minmax(0,1fr)_auto_auto] xl:contents",
};

function resolvePreviewHeaderLayoutVariant(
  showSourceFilter: boolean,
  showDateFilters: boolean,
): PreviewHeaderLayoutVariant {
  if (showSourceFilter && showDateFilters) return "source-date";
  if (showSourceFilter && !showDateFilters) return "source-no-date";
  if (!showSourceFilter && showDateFilters) return "no-source-date";
  return "no-source-no-date";
}

type PreviewHeaderProps = {
  idPrefix: string;
  sourceFilterLabel: string;
  selectedSourceId: string;
  onSelectedSourceIdChange: (value: string) => void;
  sourceOptions: PreviewSourceOption[];
  allSourcesOptionLabel: string;
  isSourceListPending: boolean;
  showSourceFilter?: boolean;
  showDateFilters?: boolean;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  onSearchChange: (searchTerm: string) => void;
  columns: string[];
  hiddenColumns: string[];
  onHiddenColumnsChange: (
    nextHiddenColumns:
      | string[]
      | ((currentHiddenColumns: string[]) => string[]),
  ) => void;
  onExport: () => void;
  isExportPending: boolean;
};

export function PreviewHeader({
  idPrefix,
  sourceFilterLabel,
  selectedSourceId,
  onSelectedSourceIdChange,
  sourceOptions,
  allSourcesOptionLabel,
  isSourceListPending,
  showSourceFilter = true,
  showDateFilters = true,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
  onSearchChange,
  columns,
  hiddenColumns,
  onHiddenColumnsChange,
  onExport,
  isExportPending,
}: PreviewHeaderProps) {
  // Cálculo dos limites dinâmicos para os filtros de data (limite baseado na seleção do outro e no máximo/mínimo estabelecido pelo source).
  const startDateMax = showDateFilters
    ? resolveDateBound([maxDate, endDate], "min")
    : undefined;
  const endDateMin = showDateFilters
    ? resolveDateBound([minDate, startDate], "max")
    : undefined;
  const layoutVariant = resolvePreviewHeaderLayoutVariant(
    showSourceFilter,
    showDateFilters,
  );
  const headerGridClassName = HEADER_GRID_CLASS_BY_VARIANT[layoutVariant];
  const actionsContainerClassName =
    ACTIONS_GRID_CLASS_BY_VARIANT[layoutVariant];

  return (
    <section className="shrink-0 space-y-3 px-1">
      <div className={headerGridClassName}>
        {showSourceFilter ? (
          // Filtro principal (repositório/projeto/pergunta)
          <div className="col-span-2 min-w-0 md:col-span-1">
            <FormSelect
              id={`${idPrefix}-source`}
              label={sourceFilterLabel}
              value={selectedSourceId}
              onChange={(event) => onSelectedSourceIdChange(event.target.value)}
              wrapperClassName="min-w-0"
              className="font-semibold"
              disabled={isSourceListPending && sourceOptions.length === 0}
            >
              <option value="">{allSourcesOptionLabel}</option>
              {sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormSelect>
          </div>
        ) : null}

        {showDateFilters ? (
          <>
            {/* Filtro de data inicial */}
            <div className="min-w-0 md:min-w-46">
              <FormDateSelector
                id={`${idPrefix}-start-date`}
                label="Start"
                value={startDate}
                onChange={(event) => onStartDateChange(event.target.value)}
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
                onChange={(event) => onEndDateChange(event.target.value)}
                min={endDateMin}
                max={maxDate}
                wrapperClassName="min-w-0"
              />
            </div>
          </>
        ) : null}

        <div className={actionsContainerClassName}>
          {/* Busca textual (expandível) */}
          <div className="col-span-2 min-w-0 md:col-span-1">
            <SearchBar
              id={`${idPrefix}-search`}
              onSearchChange={onSearchChange}
              expandable
            />
          </div>

          {/* (Botão de filtro) Controle de visibilidade de colunas */}
          <ColumnVisibilityFilter
            className="self-end"
            buttonClassName="h-11 min-h-11 w-full px-3.5 py-0 md:w-auto"
            columns={columns}
            hiddenColumns={hiddenColumns}
            onHiddenColumnsChange={onHiddenColumnsChange}
          />

          {/* Ação de exportação */}
          <div className="self-end">
            <Button
              text={isExportPending ? "Exporting..." : "Export"}
              icon={<Download />}
              fullWidth={false}
              className="h-11 min-h-11 w-full px-3.5 py-0 md:w-auto"
              onClick={() => onExport()}
              disabled={isExportPending}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export type { PreviewHeaderProps, PreviewSourceOption };

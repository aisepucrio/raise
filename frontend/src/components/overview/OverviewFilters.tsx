import {
  SourceSelectFilter,
  type SourceSelectOption,
} from "@/components/source-select-filter";
import { StartEndDateFilter } from "@/components/start-end-datefilter";

export type OverviewDateRange = {
  minDate?: string;
  maxDate?: string;
};

export type OverviewFiltersProps = {
  idPrefix: string;
  sourceFilterLabel: string;
  allSourcesOptionLabel: string;
  sourceOptions: SourceSelectOption[];
  selectedSourceId: string;
  onSourceChange: (value: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  isSourceListPending?: boolean;
  dateRange?: OverviewDateRange;
};

// Linha de filtros compartilhada: source + intervalo de datas.
export function OverviewFilters({
  idPrefix,
  sourceFilterLabel,
  allSourcesOptionLabel,
  sourceOptions,
  selectedSourceId,
  onSourceChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  isSourceListPending = false,
  dateRange,
}: OverviewFiltersProps) {
  return (
    <div className="grid gap-3 border-b-2 border-(--color-secondary-soft) p-4 md:grid-cols-2 xl:grid-cols-[2fr_minmax(0,2fr)]">
      <SourceSelectFilter
        id={`${idPrefix}-source`}
        label={sourceFilterLabel}
        value={selectedSourceId}
        onChange={onSourceChange}
        options={sourceOptions}
        allOptionLabel={allSourcesOptionLabel}
        isOptionsPending={isSourceListPending}
        wrapperClassName="min-w-0"
      />

      <StartEndDateFilter
        idPrefix={idPrefix}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        startLabel="Start date"
        endLabel="End date"
        dateRange={dateRange}
      />
    </div>
  );
}

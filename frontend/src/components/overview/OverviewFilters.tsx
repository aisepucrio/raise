import { FormSelect } from "@/components/form";
import { StartEndDateFilter } from "@/components/start-end-datefilter";

export type OverviewDateRange = {
  minDate?: string;
  maxDate?: string;
};

export type OverviewSourceOption = {
  value: string;
  label: string;
};

type OverviewFiltersProps = {
  idPrefix: string;
  sourceFilterLabel: string;
  allSourcesOptionLabel: string;
  sourceOptions: OverviewSourceOption[];
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
      <FormSelect
        id={`${idPrefix}-source`}
        label={sourceFilterLabel}
        value={selectedSourceId}
        onChange={(event) => onSourceChange(event.target.value)}
        wrapperClassName="min-w-0"
        disabled={isSourceListPending && sourceOptions.length === 0}
      >
        <option value="">{allSourcesOptionLabel}</option>
        {sourceOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </FormSelect>

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

export type { OverviewFiltersProps };

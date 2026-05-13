import { useEffect, useMemo } from "react";
import { FormDateSelector } from "@/components/form";
import { cn } from "@/lib/utils";
import {
  resolveStartEndDateState,
  type StartEndDateRange,
} from "./startEndDateFilter.utils";

export type StartEndDateFilterWidth = "full" | "compact";

export type StartEndDateFilterProps = {
  idPrefix: string;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  startLabel?: string;
  endLabel?: string;
  error?: string;
  width?: StartEndDateFilterWidth;
  className?: string;
  disabled?: boolean;
  dateRange?: StartEndDateRange;
  startWrapperClassName?: string;
  endWrapperClassName?: string;
};

const CONTAINER_CLASS_BY_WIDTH: Record<StartEndDateFilterWidth, string> = {
  // "full" keeps fields flexible; "compact" keeps a predictable minimum size.
  full: "grid grid-cols-1 gap-3 sm:grid-cols-2",
  compact: "grid grid-cols-1 gap-3 sm:grid-cols-[11.5rem_11.5rem]",
};

export function StartEndDateFilter({
  idPrefix,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = "Start",
  endLabel = "End",
  error,
  width = "full",
  className,
  disabled = false,
  dateRange,
  startWrapperClassName,
  endWrapperClassName,
}: StartEndDateFilterProps) {
  // Centralized derived state: normalizes range, clears invalid values, computes input min/max.
  const resolvedDateState = useMemo(
    () =>
      resolveStartEndDateState({
        startDate,
        endDate,
        dateRange,
      }),
    [startDate, endDate, dateRange?.minDate, dateRange?.maxDate],
  );

  // When range changes, sync external state by removing invalid dates.
  useEffect(() => {
    if (resolvedDateState.startDate !== startDate) {
      onStartDateChange(resolvedDateState.startDate);
    }

    if (resolvedDateState.endDate !== endDate) {
      onEndDateChange(resolvedDateState.endDate);
    }
  }, [
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    resolvedDateState.startDate,
    resolvedDateState.endDate,
  ]);

  return (
    <div className={cn(CONTAINER_CLASS_BY_WIDTH[width], className)}>
      {/* Start uses end date as a dynamic upper bound (when filled). */}
      <FormDateSelector
        id={`${idPrefix}-start-date`}
        label={startLabel}
        value={startDate}
        onChange={(event) => onStartDateChange(event.target.value)}
        min={resolvedDateState.startMin}
        max={resolvedDateState.startMax}
        disabled={disabled}
        wrapperClassName={cn("min-w-0", startWrapperClassName)}
        error={error}
      />

      {/* End uses start date as a dynamic lower bound (when filled). */}
      <FormDateSelector
        id={`${idPrefix}-end-date`}
        label={endLabel}
        value={endDate}
        onChange={(event) => onEndDateChange(event.target.value)}
        min={resolvedDateState.endMin}
        max={resolvedDateState.endMax}
        disabled={disabled}
        wrapperClassName={cn("min-w-0", endWrapperClassName)}
        error={error}
      />
    </div>
  );
}

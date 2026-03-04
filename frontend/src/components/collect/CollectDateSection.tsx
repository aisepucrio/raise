import { StartEndDateFilter } from "@/components/start-end-datefilter";
import { WarningBox } from "@/components/warning-box";

type CollectDateSectionProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  dateFilterIdPrefix: string;
  dateWarningMessage?: string;
  startLabel?: string;
  endLabel?: string;
};

export function CollectDateSection({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  dateFilterIdPrefix,
  dateWarningMessage,
  startLabel = "Start",
  endLabel = "Finish",
}: CollectDateSectionProps) {
  return (
    <section className="space-y-3">
      {!startDate && !endDate && dateWarningMessage ? (
        <WarningBox text={dateWarningMessage} variant="warning" />
      ) : null}

      <StartEndDateFilter
        idPrefix={dateFilterIdPrefix}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        startLabel={startLabel}
        endLabel={endLabel}
      />
    </section>
  );
}

export type { CollectDateSectionProps };

import { WarningBox } from "@/components/warning-box";
import { sourceLabels, unavailableSourceReasons, type SourceId } from "@/sources";

// Shown instead of a source's screens while its backend doesn't exist.
export default function SourceUnavailable({ source }: { source: SourceId }) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 p-4">
      <h2 className="text-lg font-semibold text-(--color-secondary)">
        {sourceLabels[source]} is unavailable
      </h2>
      <WarningBox
        variant="info"
        text={`${unavailableSourceReasons[source] ?? ""} Its overview, collection and preview screens will return once its collection jobs are ported. Data mined with the old backend isn't shown here.`}
      />
    </div>
  );
}

import { PageHeader } from "@/components/page-header";
import { useSearchParams } from "react-router-dom";
import { resolveSourceId } from "@/lib/source-section-resolver";
import { isSourceAvailable } from "@/sources";
import { sourceUiModules } from "@/sources/registry";
import SourceUnavailable from "./SourceUnavailable";

export default function OverviewPage() {
  const [searchParams] = useSearchParams();
  const source = resolveSourceId(searchParams.get("source"));
  const OverviewModule = sourceUiModules[source]?.overview;

  return (
    <section className="flex h-full min-h-0 flex-col gap-2">
      <PageHeader
        title="Overview"
        subtitle="Overview of collected date and pipeline status."
      />

      <div className="min-h-0 flex-1">
        {isSourceAvailable(source) && OverviewModule ? (
          <OverviewModule />
        ) : (
          <SourceUnavailable source={source} />
        )}
      </div>
    </section>
  );
}

import { PageHeader } from "@/components/page-header";
import { useSource } from "@/contexts/SourceContext";
import { sourceUiModules } from "@/sources/registry";

export default function OverviewPage() {
  const { source } = useSource();
  const OverviewModule = sourceUiModules[source].overview;

  return (
    <section className="flex h-full min-h-0 flex-col gap-2">
      <PageHeader
        title="Overview"
        subtitle="Overview of collected data and pipeline status."
      />

      <div className="min-h-0 flex-1">
        <OverviewModule />
      </div>
    </section>
  );
}

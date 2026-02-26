import { PageHeader } from "@/components/page-header";
import { useSource } from "@/contexts/SourceContext";
import { sourceUiModules } from "@/sources/registry";

export default function OverviewPage() {
  const { source } = useSource();
  const OverviewModule = sourceUiModules[source].overview;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Visão geral dos dados coletados e do status do pipeline."
      />

      <OverviewModule />
    </section>
  );
}

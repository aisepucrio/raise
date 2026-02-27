import { PageHeader } from "@/components/page-header";
import { useSource } from "@/contexts/SourceContext";
import { sourceUiModules } from "@/sources/registry";

export default function CollectPage() {
  const { source } = useSource();
  const CollectModule = sourceUiModules[source].collect;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Collect"
        subtitle="Configure and start collection jobs for the integrated data sources."
      />

      <CollectModule />
    </section>
  );
}

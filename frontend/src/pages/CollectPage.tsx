import { PageHeader } from "@/components/page-header";
import { useSearchParams } from "react-router-dom";
import { resolveSourceId } from "@/lib/source-section-resolver";
import { sourceUiModules } from "@/sources/registry";

export default function CollectPage() {
  const [searchParams] = useSearchParams();
  const source = resolveSourceId(searchParams.get("source"));
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

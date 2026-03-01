import { PageHeader } from "@/components/page-header";
import { useSearchParams } from "react-router-dom";
import { resolveSourceId } from "@/lib/source-section-resolver";
import { sourceUiModules } from "@/sources/registry";

export default function CollectPage() {
  const [searchParams] = useSearchParams();
  const source = resolveSourceId(searchParams.get("source"));
  const CollectModule = sourceUiModules[source].collect;

  return (
    <section className="flex h-full min-h-0 flex-col gap-2">
      <PageHeader
        title="Collect"
        subtitle="Configure and start collection jobs for the integrated data sources."
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex min-h-full flex-col justify-center">
          <CollectModule />
        </div>
      </div>
    </section>
  );
}

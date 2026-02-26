import { PageHeader } from "@/components/page-header";
import { useSource } from "@/contexts/SourceContext";
import { sourceUiModules } from "@/sources/registry";

export default function PreviewPage() {
  const { source } = useSource();
  const PreviewModule = sourceUiModules[source].preview;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Preview"
        subtitle="Visualize uma amostra dos dados antes do processamento."
      />

      <PreviewModule />
    </section>
  );
}

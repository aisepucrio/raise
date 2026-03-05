import type { ComponentType } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/page-header";
import {
  resolveSectionId,
  resolveSourceId,
} from "@/lib/source-section-resolver";
import { sourceSectionPreviewUiModules } from "@/sources/registry";

export default function PreviewPage() {
  const [searchParams] = useSearchParams();
  const source = resolveSourceId(searchParams.get("source"));
  const section = resolveSectionId(source, searchParams.get("section"));
  const previewModules = sourceSectionPreviewUiModules[source] as Record<
    string,
    ComponentType
  >;
  const PreviewModule = previewModules[section];

  return (
    <section className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <PageHeader
        title="Preview"
        subtitle="Vizualize sample date for each section to verify collection and transformation results."
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        <PreviewModule />
      </div>
    </section>
  );
}

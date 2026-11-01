import { PageHeader } from "@/components/page-header";
import { useSearchParams } from "react-router-dom";
import { resolveSourceId } from "@/lib/source-section-resolver";
import { isSourceAvailable, sourceEntityLabels } from "@/sources";
import { sourceUiModules } from "@/sources/registry";
import SourceUnavailable from "./SourceUnavailable";

// What the selected source mines from (repositories, projects, tags), titled
// by the source's own name for them, with the source's module below.
export default function EntitiesPage() {
  const [searchParams] = useSearchParams();
  const source = resolveSourceId(searchParams.get("source"));
  const EntitiesModule = sourceUiModules[source]?.entities;
  const { title, description } = sourceEntityLabels[source];

  return (
    <section className="flex h-full min-h-0 flex-col gap-2">
      <PageHeader title={title} subtitle={description} />

      <div className="min-h-0 flex-1 overflow-auto">
        {isSourceAvailable(source) && EntitiesModule ? (
          <EntitiesModule />
        ) : (
          <SourceUnavailable source={source} />
        )}
      </div>
    </section>
  );
}

import { useState } from "react";

import { SelectionButton } from "@/components/selection-button";
import type { GitlabCollectType } from "@/data";

export type GitlabOptionalCollectType = Exclude<GitlabCollectType, "metadata">;

const OPTIONAL_COLLECT_OPTIONS: ReadonlyArray<{
  collectType: GitlabOptionalCollectType;
  label: string;
}> = [
  { collectType: "commits", label: "Commits" },
  { collectType: "issues", label: "Issues" },
  { collectType: "merge_requests", label: "Merge Requests" },
  { collectType: "branches", label: "Branches" },
];

export type GitlabCollectTypesSectionProps = {
  onOptionalTypesChange: (types: GitlabOptionalCollectType[]) => void;
};

export function GitlabCollectTypesSection({
  onOptionalTypesChange,
}: GitlabCollectTypesSectionProps) {
  const [selectedOptionalTypes, setSelectedOptionalTypes] = useState<
    GitlabOptionalCollectType[]
  >([]);

  const allOptionalTypesSelected = OPTIONAL_COLLECT_OPTIONS.every(
    ({ collectType }) => selectedOptionalTypes.includes(collectType),
  );
  const selectedCollectTypesCount = 1 + selectedOptionalTypes.length;

  function updateOptionalTypes(nextTypes: GitlabOptionalCollectType[]) {
    setSelectedOptionalTypes(nextTypes);
    onOptionalTypesChange(nextTypes);
  }

  function handleToggleOptionalType(type: GitlabOptionalCollectType) {
    const isSelected = selectedOptionalTypes.includes(type);

    updateOptionalTypes(
      isSelected
        ? selectedOptionalTypes.filter((currentType) => currentType !== type)
        : [...selectedOptionalTypes, type],
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-(--color-secondary)">
            Collection Scope
          </h3>
          <p className="text-xs text-(--color-secondary-muted)">
            Choose which GitLab data types this job should collect.
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-(--color-secondary-soft) p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SelectionButton
            size="sm"
            fullWidth={false}
            pressed={allOptionalTypesSelected}
            text={allOptionalTypesSelected ? "Clear extras" : "Select all"}
            onPressedChange={(nextPressed) =>
              updateOptionalTypes(
                nextPressed
                  ? OPTIONAL_COLLECT_OPTIONS.map(({ collectType }) => collectType)
                  : [],
              )
            }
          />

          <span className="ml-auto inline-flex min-h-9 items-center rounded-md border border-(--color-secondary-soft) px-2.5 py-1 text-xs font-medium text-(--color-secondary-muted)">
            {selectedCollectTypesCount} selected
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="pointer-events-none sm:col-span-2">
            <SelectionButton
              size="sm"
              fullWidth
              pressed
              text="Metadata (always included)"
            />
          </div>

          {OPTIONAL_COLLECT_OPTIONS.map(({ collectType, label }) => (
            <SelectionButton
              key={collectType}
              size="sm"
              pressed={selectedOptionalTypes.includes(collectType)}
              text={label}
              onPressedChange={() => handleToggleOptionalType(collectType)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

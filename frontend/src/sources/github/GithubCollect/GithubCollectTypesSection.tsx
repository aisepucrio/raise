import { useState } from "react";

import { SelectionButton } from "@/components/selection-button";
import type { GithubCollectType } from "@/data";

// Optional GitHub types; metadata is always fixed in the final payload.
export type GithubOptionalCollectType = Exclude<GithubCollectType, "metadata">;

const OPTIONAL_COLLECT_OPTIONS: ReadonlyArray<{
  collectType: GithubOptionalCollectType;
  label: string;
}> = [
  { collectType: "issues", label: "Issues" },
  { collectType: "comments", label: "Comments" },
  { collectType: "pull_requests", label: "Pull requests" },
  { collectType: "commits", label: "Commits" },
];

export type GithubCollectTypesSectionProps = {
  onOptionalTypesChange: (types: GithubOptionalCollectType[]) => void;
};

export function GithubCollectTypesSection({
  onOptionalTypesChange,
}: GithubCollectTypesSectionProps) {
  // state local of the types extra that the user seleciona.
  const [selectedOptionalTypes, setSelectedOptionalTypes] = useState<
    GithubOptionalCollectType[]
  >([]);

  const allOptionalTypesSelected = OPTIONAL_COLLECT_OPTIONS.every(
    ({ collectType }) => selectedOptionalTypes.includes(collectType),
  );
  const selectedCollectTypesCount = 1 + selectedOptionalTypes.length;

  // updates state local and replica for the screen pai.
  function updateOptionalTypes(nextTypes: GithubOptionalCollectType[]) {
    setSelectedOptionalTypes(nextTypes);
    onOptionalTypesChange(nextTypes);
  }

  // alterna the option individual.
  function handleToggleOptionalType(type: GithubOptionalCollectType) {
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
            Choose which GitHub date types this job should collect.
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

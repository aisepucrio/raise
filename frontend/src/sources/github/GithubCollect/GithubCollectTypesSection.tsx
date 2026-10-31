import { SelectionButton } from "@/components/selection-button";
import type { GithubCollectType } from "./githubCollectParameters";

type CollectOption = {
  collectType: GithubCollectType;
  label: string;
};

// Mined from a local clone: needs no token.
const REPOSITORY_OPTIONS: readonly CollectOption[] = [
  { collectType: "git_commits", label: "Commits (history, branches, tags)" },
  // Implies commits; the API mines diffs with them.
  { collectType: "git_diffs", label: "File diffs (with the commits; large)" },
];

// Fetched from the GitHub API: needs a GitHub token under Credentials.
const GITHUB_OPTIONS: readonly CollectOption[] = [
  {
    collectType: "metadata",
    label: "Repository details (stars, languages, …)",
  },
  { collectType: "issues", label: "Issues" },
  { collectType: "pull_requests", label: "Pull requests" },
  { collectType: "commits", label: "Commit authors and PR links" },
  { collectType: "releases", label: "Releases" },
  { collectType: "users", label: "User profiles" },
];

const ALL_OPTIONS = [...REPOSITORY_OPTIONS, ...GITHUB_OPTIONS];

export type GithubCollectTypesSectionProps = {
  selectedTypes: readonly GithubCollectType[];
  onSelectedTypesChange: (types: GithubCollectType[]) => void;
};

function OptionGroup({
  title,
  options,
  selectedTypes,
  onToggle,
}: {
  title: string;
  options: readonly CollectOption[];
  selectedTypes: readonly GithubCollectType[];
  onToggle: (type: GithubCollectType) => void;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-(--color-secondary)">
        {title}
      </h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map(({ collectType, label }) => (
          <SelectionButton
            key={collectType}
            size="sm"
            pressed={selectedTypes.includes(collectType)}
            text={label}
            onPressedChange={() => onToggle(collectType)}
          />
        ))}
      </div>
    </div>
  );
}

// What to mine, grouped by where it comes from. Every option is optional; at
// least one must be picked. The page warns when GitHub options lack a token.
export function GithubCollectTypesSection({
  selectedTypes,
  onSelectedTypesChange,
}: GithubCollectTypesSectionProps) {
  const allSelected = ALL_OPTIONS.every(({ collectType }) =>
    selectedTypes.includes(collectType),
  );

  function handleToggle(type: GithubCollectType) {
    onSelectedTypesChange(
      selectedTypes.includes(type)
        ? selectedTypes.filter((current) => current !== type)
        : [...selectedTypes, type],
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-(--color-secondary)">
            What to collect
          </h3>
          <p className="text-xs text-(--color-secondary-muted)">
            Pick at least one. Running a collection again only adds what's new.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex min-h-9 items-center rounded-md border border-(--color-secondary-soft) px-2.5 py-1 text-xs font-medium text-(--color-secondary-muted)">
            {selectedTypes.length} selected
          </span>
          <SelectionButton
            size="sm"
            fullWidth={false}
            pressed={allSelected}
            text={allSelected ? "Clear all" : "Select all"}
            onPressedChange={(nextPressed) =>
              onSelectedTypesChange(
                nextPressed
                  ? ALL_OPTIONS.map(({ collectType }) => collectType)
                  : [],
              )
            }
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-(--color-secondary-soft) p-3">
        <OptionGroup
          title="From the git repository"
          options={REPOSITORY_OPTIONS}
          selectedTypes={selectedTypes}
          onToggle={handleToggle}
        />
        <OptionGroup
          title="From GitHub"
          options={GITHUB_OPTIONS}
          selectedTypes={selectedTypes}
          onToggle={handleToggle}
        />
      </div>
    </section>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  CollectActions,
  CollectHeader,
  CollectTagsSection,
  CollectWrapper,
} from "@/components/collect";
import { FormDateSelector } from "@/components/form";
import { StartEndDateFilter } from "@/components/start-end-datefilter";
import { WarningBox } from "@/components/warning-box";
import {
  hasRole,
  useCredentialsQuery,
  useMeQuery,
  useStartCollectionMutation,
} from "@/data";
import { runCollectWithFeedback } from "@/sources/shared/CollectShared";
import GithubCollectModal from "./GithubCollectModal";
import { GithubCollectTypesSection } from "./GithubCollectTypesSection";
import {
  DATED_RESOURCES,
  UPDATABLE_RESOURCES,
  buildGithubCollectionParameters,
  githubResourcesOf,
  type GithubCollectType,
} from "./githubCollectParameters";

// Commits and repository details: a useful, cheap first collection.
const DEFAULT_TYPES: GithubCollectType[] = ["git_commits", "metadata"];

const RESOURCE_LABELS: Record<string, string> = {
  metadata: "repository details",
  issues: "issues",
  pull_requests: "pull requests",
  commits: "commit authors and PR links",
  releases: "releases",
  users: "user profiles",
};

// "a", "a and b", "a, b and c".
function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export default function GithubCollect() {
  // Redirects to the jobs screen while preserving current source context.
  const navigate = useNavigate();
  const collectMutation = useStartCollectionMutation();
  // Starting collections needs the researcher role.
  const { data: currentUser } = useMeQuery();
  const canCollect = hasRole(currentUser?.role, "researcher");
  const credentialsQuery = useCredentialsQuery({ enabled: canCollect });
  const isAdmin = hasRole(currentUser?.role, "admin");

  // Repositories added from the modal in owner/repo format.
  const [repositories, setRepositories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] =
    useState<GithubCollectType[]>(DEFAULT_TYPES);
  // Optional date filters for GitHub issues, pull requests and releases.
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [updatedSince, setUpdatedSince] = useState("");
  // Controls opening of the repository add modal.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const resources = githubResourcesOf(selectedTypes);
  const usesGithub = resources.length > 0;
  const isDated = resources.some((r) => DATED_RESOURCES.includes(r));
  const isUpdatable = resources.some((r) => UPDATABLE_RESOURCES.includes(r));
  const hasGithubToken = (credentialsQuery.data ?? []).some(
    (c) => c.platform === "github" && c.status === "active",
  );
  const showTokenWarning =
    usesGithub && credentialsQuery.isSuccess && !hasGithubToken;

  // Inserts the new repository already normalized/validated by the modal.
  function handleAddRepository(normalizedRepository: string) {
    setRepositories((currentRepositories) => [
      ...currentRepositories,
      normalizedRepository,
    ]);
  }

  // Removes a specific repository from the current list.
  function handleRemoveRepository(repositoryToRemove: string) {
    setRepositories((currentRepositories) =>
      currentRepositories.filter(
        (repository) => repository !== repositoryToRemove,
      ),
    );
  }

  // Builds the final payload and executes the collection mutation.
  async function handleCollect() {
    const parameters = buildGithubCollectionParameters(
      repositories,
      selectedTypes,
      {
        createdFrom,
        createdTo,
        updatedSince,
      },
    );

    await runCollectWithFeedback({
      execute: () =>
        collectMutation.mutateAsync({ platform: "git", parameters }),
      source: "github",
      navigate,
    });
  }

  // A plain-language description of what the button will do.
  const summaryParts: string[] = [];
  if (selectedTypes.includes("git_diffs")) {
    summaryParts.push("mine the commit history with each file's diff");
  } else if (selectedTypes.includes("git_commits")) {
    summaryParts.push("mine the commit history");
  }
  if (usesGithub) {
    let github = `fetch ${joinList(resources.map((r) => RESOURCE_LABELS[r] ?? r))} from GitHub`;
    const filters: string[] = [];
    if (isDated && (createdFrom || createdTo)) {
      filters.push(
        `created ${createdFrom ? `from ${createdFrom}` : ""}${createdFrom && createdTo ? " " : ""}${createdTo ? `until ${createdTo}` : ""}`,
      );
    }
    if (isUpdatable && updatedSince) {
      filters.push(`updated since ${updatedSince}`);
    }
    if (filters.length > 0) github += ` (only items ${filters.join(", ")})`;
    summaryParts.push(github);
  }
  const repositoryCount =
    repositories.length === 1
      ? "1 repository"
      : `${repositories.length} repositories`;
  const summary =
    repositories.length === 0
      ? "Add at least one repository."
      : summaryParts.length === 0
        ? "Pick at least one thing to collect."
        : `For ${repositoryCount}, this will ${joinList(summaryParts)}.`;
  const isReady = repositories.length > 0 && summaryParts.length > 0;

  return (
    <>
      {/* Shared base structure for collect pages (header, tags, dates, submit). */}
      <CollectWrapper>
        {/* Main header with title, description, and add-item action. */}
        <CollectHeader
          title="GitHub Collect"
          description="Choose repositories, then what to collect from them."
          addButtonText="Add repository"
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {!canCollect && currentUser ? (
          <WarningBox
            variant="warning"
            text="Your role (viewer) can read data but not start collections. Ask an admin for the researcher role."
          />
        ) : null}

        {/* List of added items (repositories/projects/tags). */}
        <CollectTagsSection
          title="Repositories"
          items={repositories}
          onRemoveItem={handleRemoveRepository}
          emptyMessage='No repositories added yet. Click "Add repository" above to get started.'
        />

        <GithubCollectTypesSection
          selectedTypes={selectedTypes}
          onSelectedTypesChange={setSelectedTypes}
        />

        {showTokenWarning ? (
          <div className="space-y-1">
            <WarningBox
              variant="warning"
              text="There's no working GitHub token yet, so the GitHub items would fail. Commits from the git repository still work."
            />
            <p className="text-xs text-(--color-secondary-muted)">
              {isAdmin ? (
                <>
                  Add one under{" "}
                  <Link
                    to="/credentials?source=github"
                    className="font-semibold underline"
                  >
                    Credentials
                  </Link>
                  .
                </>
              ) : (
                "Ask an admin to add one under Credentials."
              )}
            </p>
          </div>
        ) : null}

        {/* Date filters apply only to GitHub issues, pull requests and releases. */}
        {isDated ? (
          <section className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-(--color-secondary)">
                Limit by date{" "}
                <span className="font-normal text-(--color-secondary-muted)">
                  (optional)
                </span>
              </h3>
              <p className="text-xs text-(--color-secondary-muted)">
                Applies to GitHub issues, pull requests and releases. Leave it
                empty to collect everything. Commits are always collected in
                full.
              </p>
            </div>
            <StartEndDateFilter
              idPrefix="github-collect-created"
              startDate={createdFrom}
              endDate={createdTo}
              onStartDateChange={setCreatedFrom}
              onEndDateChange={setCreatedTo}
              startLabel="Created from"
              endLabel="Created until"
            />
            {isUpdatable ? (
              <FormDateSelector
                id="github-collect-updated-since"
                label="Only refresh items updated since"
                hint="A quick way to update repositories you've collected before: only issues and pull requests changed since this day are fetched again."
                value={updatedSince}
                onChange={(event) => setUpdatedSince(event.target.value)}
                wrapperClassName="max-w-sm"
              />
            ) : null}
          </section>
        ) : null}

        <p className="text-sm text-(--color-secondary)" aria-live="polite">
          {summary}
        </p>

        {/* Final action that starts collection. */}
        <CollectActions
          onCollect={() => void handleCollect()}
          isCollectPending={collectMutation.isPending}
          isCollectDisabled={
            !canCollect || collectMutation.isPending || !isReady
          }
        />
      </CollectWrapper>

      <GithubCollectModal
        open={isAddModalOpen}
        repositories={repositories}
        onClose={() => setIsAddModalOpen(false)}
        onAddRepository={handleAddRepository}
      />
    </>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CollectActions,
  CollectDateSection,
  CollectHeader,
  CollectTagsSection,
  CollectWrapper,
} from "@/components/collect";
import { useGithubCollectMutation, type GithubCollectBody } from "@/data";
import {
  mapItemsToCollectTags,
  runCollectWithFeedback,
} from "@/sources/shared/CollectShared";
import GithubCollectModal from "./GithubCollectModal";
import {
  GithubCollectTypesSection,
  type GithubOptionalCollectType,
} from "./GithubCollectTypesSection";

// Formats a date into the ISO format required by the GitHub API.
function formatDateGitHub(dateStr: string) {
  if (!dateStr) return undefined;

  const date = new Date(dateStr);
  date.setHours(13, 42, 0, 888);

  return date.toISOString();
}

export default function GithubCollect() {
  // Redirects to the jobs screen while preserving current source context.
  const navigate = useNavigate();
  // Triggers GitHub collection and invalidates the jobs list when done.
  const collectMutation = useGithubCollectMutation();

  // Repositories added from the modal in owner/repo format.
  const [repositories, setRepositories] = useState<string[]>([]);
  // Optional date window sent to limit collection.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Extra selected types from the scope section.
  const [selectedOptionalTypes, setSelectedOptionalTypes] = useState<
    GithubOptionalCollectType[]
  >([]);
  // Controls opening of the repository add modal.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
    // `metadata` is always included; extra types follow the user's selection.
    const payload: GithubCollectBody = {
      repositories,
      depth: "basic",
      collect_types: ["metadata", ...selectedOptionalTypes],
      ...(startDate ? { start_date: formatDateGitHub(startDate) } : {}),
      ...(endDate ? { end_date: formatDateGitHub(endDate) } : {}),
    };

    await runCollectWithFeedback({
      execute: () => collectMutation.mutateAsync(payload),
      successDescription: "GitHub collection started successfully.",
      errorFallbackMessage: "Failed to start GitHub collection.",
      source: "github",
      navigate,
    });
  }

  // Adapts the repository list to removable tag format.
  const repositoryTags = mapItemsToCollectTags(
    repositories,
    (repository) => repository,
    handleRemoveRepository,
  );

  return (
    <>
      {/* Shared base structure for collect pages (header, tags, dates, submit). */}
      <CollectWrapper>
        {/* Main header with title, description, and add-item action. */}
        <CollectHeader
          title="GitHub Collect"
          description="Configure repositories, optional date range and collection types."
          addButtonText="Add repository"
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {/* List of added items (repositories/projects/tags). */}
        <CollectTagsSection
          tagsHeading={`Repositories (${repositories.length})`}
          tags={repositoryTags}
          emptyTagsMessage='No repositories added yet. Click the "Add repository" button above to get started.'
        />

        {/* Shared date filter and contextual warning. */}
        <CollectDateSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          dateFilterIdPrefix="github-collect"
          dateWarningMessage="Leaving both date fields empty will mine date from the entire period."
        />

        {/* Extension area for source-specific content. */}
        <GithubCollectTypesSection onOptionalTypesChange={setSelectedOptionalTypes} />

        {/* Final action that starts collection. */}
        <CollectActions
          collectButtonText="Collect"
          collectPendingButtonText="Collecting..."
          onCollect={() => void handleCollect()}
          isCollectPending={collectMutation.isPending}
          isCollectDisabled={collectMutation.isPending || repositories.length === 0}
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

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

// Formata the date for the format ISO exigido pela API of the GitHub.
function formatDateGitHub(dateStr: string) {
  if (!dateStr) return undefined;

  const date = new Date(dateStr);
  date.setHours(13, 42, 0, 888);

  return date.toISOString();
}

export default function GithubCollect() {
  // Redirects for the screen of jobs mantendo the context of the source atual.
  const navigate = useNavigate();
  // triggers the collection in the endpoint of GitHub and invalid the listing of jobs to concluir.
  const collectMutation = useGithubCollectMutation();

  // repositories in the format owner/repo added in the modal.
  const [repositories, setRepositories] = useState<string[]>([]);
  // Janela optional of dates sent for limitar the collection.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // types extra selected in the block of scope.
  const [selectedOptionalTypes, setSelectedOptionalTypes] = useState<
    GithubOptionalCollectType[]
  >([]);
  // Controla abertura of the modal of inclusion of repository.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Insere the new repository already normalizado/validated pelo modal.
  function handleAddRepository(normalizedRepository: string) {
    setRepositories((currentRepositories) => [
      ...currentRepositories,
      normalizedRepository,
    ]);
  }

  // removes the repository specific of the list atual.
  function handleRemoveRepository(repositoryToRemove: string) {
    setRepositories((currentRepositories) =>
      currentRepositories.filter(
        (repository) => repository !== repositoryToRemove,
      ),
    );
  }

  // Builds the final payload and executes the collection mutation.
  async function handleCollect() {
    // `metadata` always vai junto; types extra entram according to the selection of the user.
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

  // adapts the list of repositories for the format of tags removable.
  const repositoryTags = mapItemsToCollectTags(
    repositories,
    (repository) => repository,
    handleRemoveRepository,
  );

  return (
    <>
      {/* Estrutura visual base shared pelos collects (header, tags, dates and button of submit). */}
      <CollectWrapper>
        {/* Header main with title, description and action of add item */}
        <CollectHeader
          title="GitHub Collect"
          description="Configure repositories, optional date range and collection types."
          addButtonText="Add repository"
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {/* list of items added (repositories/projects/tags) */}
        <CollectTagsSection
          tagsHeading={`Repositories (${repositories.length})`}
          tags={repositoryTags}
          emptyTagsMessage='No repositories added yet. Click the "Add repository" button above to get started.'
        />

        {/* filter of date shared and warning contextual */}
        <CollectDateSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          dateFilterIdPrefix="github-collect"
          dateWarningMessage="Leaving both date fields empty will mine date from the entire period."
        />

        {/* area of extension for content specific of the source */}
        <GithubCollectTypesSection onOptionalTypesChange={setSelectedOptionalTypes} />

        {/* final action to trigger collection */}
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

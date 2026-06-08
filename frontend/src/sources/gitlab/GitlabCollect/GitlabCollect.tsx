import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CollectActions,
  CollectDateSection,
  CollectHeader,
  CollectTagsSection,
  CollectWrapper,
} from "@/components/collect";
import { useGitlabCollectMutation, type GitlabCollectBody } from "@/data";
import {
  mapItemsToCollectTags,
  runCollectWithFeedback,
} from "@/sources/shared/CollectShared";
import GitlabCollectModal from "./GitlabCollectModal";
import {
  GitlabCollectTypesSection,
  type GitlabOptionalCollectType,
} from "./GitlabCollectTypesSection";

function formatDateGitlab(dateStr: string) {
  if (!dateStr) return undefined;

  const date = new Date(dateStr);
  date.setHours(13, 42, 0, 888);

  return date.toISOString();
}

export default function GitlabCollect() {
  const navigate = useNavigate();
  const collectMutation = useGitlabCollectMutation();

  const [projects, setProjects] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedOptionalTypes, setSelectedOptionalTypes] = useState<
    GitlabOptionalCollectType[]
  >([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  function handleAddProject(normalizedProject: string) {
    setProjects((currentProjects) => [...currentProjects, normalizedProject]);
  }

  function handleRemoveProject(projectToRemove: string) {
    setProjects((currentProjects) =>
      currentProjects.filter((project) => project !== projectToRemove),
    );
  }

  async function handleCollect() {
    const payload: GitlabCollectBody = {
      repositories: projects,
      depth: "basic",
      collect_types: ["metadata", ...selectedOptionalTypes],
      ...(startDate ? { start_date: formatDateGitlab(startDate) } : {}),
      ...(endDate ? { end_date: formatDateGitlab(endDate) } : {}),
    };

    await runCollectWithFeedback({
      execute: () => collectMutation.mutateAsync(payload),
      successDescription: "GitLab collection started successfully.",
      errorFallbackMessage: "Failed to start GitLab collection.",
      source: "gitlab",
      navigate,
    });
  }

  const projectTags = mapItemsToCollectTags(
    projects,
    (project) => project,
    handleRemoveProject,
  );

  return (
    <>
      <CollectWrapper>
        <CollectHeader
          title="GitLab Collect"
          description="Configure project paths, optional date range and collection types."
          addButtonText="Add project"
          onAddClick={() => setIsAddModalOpen(true)}
        />

        <CollectTagsSection
          tagsHeading={`Projects (${projects.length})`}
          tags={projectTags}
          emptyTagsMessage='No projects added yet. Click the "Add project" button above to get started.'
        />

        <CollectDateSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          dateFilterIdPrefix="gitlab-collect"
          dateWarningMessage="Leaving both date fields empty will mine data from the entire period."
        />

        <GitlabCollectTypesSection
          onOptionalTypesChange={setSelectedOptionalTypes}
        />

        <CollectActions
          collectButtonText="Collect"
          collectPendingButtonText="Collecting..."
          onCollect={() => void handleCollect()}
          isCollectPending={collectMutation.isPending}
          isCollectDisabled={collectMutation.isPending || projects.length === 0}
        />
      </CollectWrapper>

      <GitlabCollectModal
        open={isAddModalOpen}
        projects={projects}
        onClose={() => setIsAddModalOpen(false)}
        onAddProject={handleAddProject}
      />
    </>
  );
}

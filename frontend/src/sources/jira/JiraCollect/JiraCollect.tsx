import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CollectActions,
  CollectDateSection,
  CollectHeader,
  CollectTagsSection,
  CollectWrapper,
} from "@/components/collect";
import {
  useJiraCollectMutation,
  type JiraCollectBody,
  type JiraProject,
} from "@/data";
import {
  mapItemsToCollectTags,
  runCollectWithFeedback,
} from "@/sources/shared/CollectShared";
import JiraCollectModal from "./JiraCollectModal";

export default function JiraCollect() {
  // Redirects to jobs with source=jira after starting collection.
  const navigate = useNavigate();
  // Mutation responsible for enviar the payload of projects for the endpoint Jira.
  const collectMutation = useJiraCollectMutation();

  // list of projects selected in the format { jira_domain, project_key }.
  const [projects, setProjects] = useState<JiraProject[]>([]);
  // filter of period optional sent to backend.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // state of the modal that adds novos projects.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // adds the project already validated pelo modal.
  function handleAddProject(project: JiraProject) {
    setProjects((currentProjects) => [...currentProjects, project]);
  }

  // removes the item exact of the list comparing domain + project key.
  function handleRemoveProject(projectToRemove: JiraProject) {
    setProjects((currentProjects) =>
      currentProjects.filter(
        (project) =>
          !(
            project.jira_domain === projectToRemove.jira_domain &&
            project.project_key === projectToRemove.project_key
          ),
      ),
    );
  }

  // Builds the final Jira collection payload and executes the mutation.
  async function handleCollect() {
    // when dates not are filled, the collection roda for entire the period available.
    const payload: JiraCollectBody = {
      projects,
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    };

    await runCollectWithFeedback({
      execute: () => collectMutation.mutateAsync(payload),
      successDescription: "Jira collection started successfully.",
      errorFallbackMessage: "Failed to start Jira collection.",
      source: "jira",
      navigate,
    });
  }

  // converts projects for the format of tags shown in the block of tags.
  const projectTags = mapItemsToCollectTags(
    projects,
    (project) => `${project.jira_domain}/${project.project_key}`,
    handleRemoveProject,
  );

  return (
    <>
      {/* Estrutura visual shared: header, list of projects, dates and submit. */}
      <CollectWrapper>
        {/* Header main with title, description and action of add item */}
        <CollectHeader
          title="Jira Collect"
          description="Configure projects and optional date range."
          addButtonText="Add project"
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {/* list of items added (repositories/projects/tags) */}
        <CollectTagsSection
          tagsHeading={`Projects (${projects.length})`}
          tags={projectTags}
          emptyTagsMessage='No projects added yet. Click the "Add project" button above to get started.'
        />

        {/* filter of date shared and warning contextual */}
        <CollectDateSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          dateFilterIdPrefix="jira-collect"
          dateWarningMessage="Leaving both date fields empty will mine date from the entire period."
        />

        {/* final action to trigger collection */}
        <CollectActions
          collectButtonText="Collect"
          collectPendingButtonText="Collecting..."
          onCollect={() => void handleCollect()}
          isCollectPending={collectMutation.isPending}
          isCollectDisabled={collectMutation.isPending || projects.length === 0}
        />
      </CollectWrapper>

      {/* Modal specific of the Jira for inclusion of domain + key of project. */}
      <JiraCollectModal
        open={isAddModalOpen}
        projects={projects}
        onClose={() => setIsAddModalOpen(false)}
        onAddProject={handleAddProject}
      />
    </>
  );
}

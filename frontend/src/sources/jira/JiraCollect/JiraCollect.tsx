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
  // Mutation responsible for sending the project payload to the Jira endpoint.
  const collectMutation = useJiraCollectMutation();

  // Selected projects in the { jira_domain, project_key } format.
  const [projects, setProjects] = useState<JiraProject[]>([]);
  // Optional date-range filter sent to the backend.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Modal state for adding new projects.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Adds a project already validated by the modal.
  function handleAddProject(project: JiraProject) {
    setProjects((currentProjects) => [...currentProjects, project]);
  }

  // Removes the exact project by matching domain + project key.
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
    // If dates are empty, collection runs over the full available period.
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

  // Converts projects to the tag format used in the tags section.
  const projectTags = mapItemsToCollectTags(
    projects,
    (project) => `${project.jira_domain}/${project.project_key}`,
    handleRemoveProject,
  );

  return (
    <>
      {/* Shared visual structure: header, project list, dates, and submit. */}
      <CollectWrapper>
        {/* Main header with title, description, and add-item action. */}
        <CollectHeader
          title="Jira Collect"
          description="Configure projects and optional date range."
          addButtonText="Add project"
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {/* List of added items (repositories/projects/tags). */}
        <CollectTagsSection
          tagsHeading={`Projects (${projects.length})`}
          tags={projectTags}
          emptyTagsMessage='No projects added yet. Click the "Add project" button above to get started.'
        />

        {/* Shared date filter and contextual warning. */}
        <CollectDateSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          dateFilterIdPrefix="jira-collect"
          dateWarningMessage="Leaving both date fields empty will mine date from the entire period."
        />

        {/* Final action that starts collection. */}
        <CollectActions
          collectButtonText="Collect"
          collectPendingButtonText="Collecting..."
          onCollect={() => void handleCollect()}
          isCollectPending={collectMutation.isPending}
          isCollectDisabled={collectMutation.isPending || projects.length === 0}
        />
      </CollectWrapper>

      {/* Jira-specific modal to add a domain + project key. */}
      <JiraCollectModal
        open={isAddModalOpen}
        projects={projects}
        onClose={() => setIsAddModalOpen(false)}
        onAddProject={handleAddProject}
      />
    </>
  );
}

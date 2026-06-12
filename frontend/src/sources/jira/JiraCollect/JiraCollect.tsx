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
} from "@/data";
import { runCollectWithFeedback } from "@/sources/shared/CollectShared";
import JiraCollectModal from "./JiraCollectModal";

export default function JiraCollect() {
  // Redirects to jobs with source=jira after starting collection.
  const navigate = useNavigate();
  // Mutation responsible for sending the collect payload to the Jira endpoint.
  const collectMutation = useJiraCollectMutation();

  // Selected projects in the same target format used by the collect endpoint.
  const [projects, setProjects] = useState<string[]>([]);
  // Optional date-range filter sent to the backend.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Modal state for adding new projects.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Adds a project already validated by the modal.
  function handleAddProject(project: string) {
    setProjects((currentProjects) => [...currentProjects, project]);
  }

  // Removes the exact project target.
  function handleRemoveProject(projectToRemove: string) {
    setProjects((currentProjects) =>
      currentProjects.filter((project) => project !== projectToRemove),
    );
  }

  // Builds the final Jira collection payload and executes the mutation.
  async function handleCollect() {
    // If dates are empty, collection runs over the full available period.
    const payload: JiraCollectBody = {
      targets: projects,
      collect_types: ["issues"],
      start_date: startDate || null,
      end_date: endDate || null,
      filters: {},
      options: {},
    };

    await runCollectWithFeedback({
      execute: () => collectMutation.mutateAsync(payload),
      source: "jira",
      navigate,
    });
  }

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
          title="Projects"
          items={projects}
          onRemoveItem={handleRemoveProject}
          emptyMessage='No projects added yet. Click the "Add project" button above to get started.'
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

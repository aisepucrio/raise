import { useEffect, useRef, useState } from "react";

import { CollectFormModal } from "@/components/collect";
import { FormInput } from "@/components/form";
import type { JiraProject } from "@/data";
import { containsItemIgnoreCase } from "@/sources/shared/CollectShared";

export type JiraCollectModalProps = {
  open: boolean;
  projects: readonly JiraProject[];
  onClose: () => void;
  onAddProject: (project: JiraProject) => void;
};

// Normalizes user domain input, removing protocol and trailing slash.
function normalizeJiraDomainInput(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

// Normalizes the project key by removing extra spaces.
function normalizeJiraProjectKeyInput(value: string) {
  return value.trim();
}

// Builds the unique key used to compare duplicate projects.
function buildProjectIdentifier(jiraDomain: string, projectKey: string) {
  return `${jiraDomain}/${projectKey}`;
}

export default function JiraCollectModal({
  open,
  projects,
  onClose,
  onAddProject,
}: JiraCollectModalProps) {
  // Local state for both fields and the shared error.
  const jiraDomainInputRef = useRef<HTMLInputElement | null>(null);
  const [jiraDomainInput, setJiraDomainInput] = useState("");
  const [jiraProjectKeyInput, setJiraProjectKeyInput] = useState("");
  const [addProjectError, setAddProjectError] = useState<string | null>(null);

  // Resets fields when the modal closes.
  useEffect(() => {
    if (open) return;

    setJiraDomainInput("");
    setJiraProjectKeyInput("");
    setAddProjectError(null);
  }, [open]);

  // validates domain/key and adds the project.
  function handleConfirmAddProject() {
    const normalizedJiraDomain = normalizeJiraDomainInput(jiraDomainInput);
    const normalizedProjectKey =
      normalizeJiraProjectKeyInput(jiraProjectKeyInput);

    if (!normalizedJiraDomain || !normalizedProjectKey) {
      setAddProjectError("Fill in both domain and project key.");
      return;
    }

    const projectIdentifier = buildProjectIdentifier(
      normalizedJiraDomain,
      normalizedProjectKey,
    );
    const existingProjectIdentifiers = projects.map((project) =>
      buildProjectIdentifier(project.jira_domain, project.project_key),
    );

    if (containsItemIgnoreCase(existingProjectIdentifiers, projectIdentifier)) {
      setAddProjectError("Project already added.");
      return;
    }

    onAddProject({
      jira_domain: normalizedJiraDomain,
      project_key: normalizedProjectKey,
    });
    setAddProjectError(null);
    onClose();
  }

  return (
    <CollectFormModal
      open={open}
      onClose={onClose}
      title="Add project"
      subtitle="Provide the Jira domain and project key."
      initialFocusRef={jiraDomainInputRef}
      onConfirm={handleConfirmAddProject}
    >
      {/* Block with the two Jira-required fields. */}
      <div className="space-y-3">
        <FormInput
          id="jira-collect-domain-input"
          ref={jiraDomainInputRef}
          label="Jira domain"
          value={jiraDomainInput}
          onChange={(event) => {
            setJiraDomainInput(event.target.value);
            if (addProjectError) setAddProjectError(null);
          }}
          placeholder="your-domain.atlassian.net"
          error={addProjectError ?? undefined}
        />

        <FormInput
          id="jira-collect-project-key-input"
          label="Project key"
          value={jiraProjectKeyInput}
          onChange={(event) => {
            setJiraProjectKeyInput(event.target.value);
            if (addProjectError) setAddProjectError(null);
          }}
          placeholder="RAISE"
        />
      </div>
    </CollectFormModal>
  );
}

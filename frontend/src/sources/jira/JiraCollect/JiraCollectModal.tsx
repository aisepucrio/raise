import { useEffect, useRef, useState } from "react";

import { CollectFormModal } from "@/components/collect";
import { FormInput } from "@/components/form";
import type { JiraProject } from "@/data";
import { containsItemIgnoreCase } from "@/sources/shared/CollectShared";
import { parseJiraUrl } from "@/sources/shared/parseCollectUrl";

export type JiraCollectModalProps = {
  open: boolean;
  projects: readonly JiraProject[];
  onClose: () => void;
  onAddProject: (project: JiraProject) => void;
};

function buildProjectIdentifier(jiraDomain: string, projectKey: string) {
  return `${jiraDomain}/${projectKey}`;
}

export default function JiraCollectModal({
  open,
  projects,
  onClose,
  onAddProject,
}: JiraCollectModalProps) {
  const jiraUrlInputRef = useRef<HTMLInputElement | null>(null);
  const [jiraUrlInput, setJiraUrlInput] = useState("");
  const [addProjectError, setAddProjectError] = useState<string | null>(null);

  useEffect(() => {
    if (open) return;
    setJiraUrlInput("");
    setAddProjectError(null);
  }, [open]);

  function handleConfirmAddProject() {
    const parsed = parseJiraUrl(jiraUrlInput);

    if (!parsed) {
      setAddProjectError(
        "Paste a valid Jira URL (e.g. https://your-domain.atlassian.net/browse/PROJ-123)",
      );
      return;
    }

    const projectIdentifier = buildProjectIdentifier(
      parsed.jira_domain,
      parsed.project_key,
    );
    const existingIdentifiers = projects.map((p) =>
      buildProjectIdentifier(p.jira_domain, p.project_key),
    );

    if (containsItemIgnoreCase(existingIdentifiers, projectIdentifier)) {
      setAddProjectError("Project already added.");
      return;
    }

    onAddProject(parsed);
    setAddProjectError(null);
    onClose();
  }

  return (
    <CollectFormModal
      open={open}
      onClose={onClose}
      title="Add project"
      subtitle="Paste any Jira URL — board, backlog, or issue."
      initialFocusRef={jiraUrlInputRef}
      onConfirm={handleConfirmAddProject}
    >
      <FormInput
        id="jira-collect-url-input"
        ref={jiraUrlInputRef}
        label="Jira URL"
        value={jiraUrlInput}
        onChange={(event) => {
          setJiraUrlInput(event.target.value);
          if (addProjectError) setAddProjectError(null);
        }}
        placeholder="https://your-domain.atlassian.net/browse/PROJ-123"
        error={addProjectError ?? undefined}
      />
    </CollectFormModal>
  );
}

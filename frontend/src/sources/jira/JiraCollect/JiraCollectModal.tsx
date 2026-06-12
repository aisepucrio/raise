import { useEffect, useRef, useState } from "react";

import { CollectFormModal } from "@/components/collect";
import { FormInput } from "@/components/form";
import { containsItemIgnoreCase } from "@/sources/shared/CollectShared";
import { parseJiraUrl } from "@/sources/shared/parseCollectUrl";

export type JiraCollectModalProps = {
  open: boolean;
  projects: readonly string[];
  onClose: () => void;
  onAddProject: (project: string) => void;
};

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

    if (containsItemIgnoreCase(projects, parsed)) {
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

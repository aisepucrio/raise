import { useEffect, useRef, useState } from "react";

import { CollectFormModal } from "@/components/collect";
import { FormInput } from "@/components/form";
import { containsItemIgnoreCase } from "@/sources/shared/CollectShared";
import { parseGitlabUrl } from "@/sources/shared/parseCollectUrl";

type GitlabCollectModalProps = {
  open: boolean;
  projects: readonly string[];
  onClose: () => void;
  onAddProject: (project: string) => void;
};

function normalizeProjectInput(value: string): string {
  return parseGitlabUrl(value) ?? value.trim().replace(/\/+$/, "");
}

function isValidProjectPath(value: string) {
  return /^[^/\s]+(?:\/[^/\s]+)+$/.test(value);
}

export default function GitlabCollectModal({
  open,
  projects,
  onClose,
  onAddProject,
}: GitlabCollectModalProps) {
  const addProjectInputRef = useRef<HTMLInputElement | null>(null);
  const [projectInput, setProjectInput] = useState("");
  const [addProjectError, setAddProjectError] = useState<string | null>(null);

  useEffect(() => {
    if (open) return;
    setProjectInput("");
    setAddProjectError(null);
  }, [open]);

  function handleConfirmAddProject() {
    const normalizedProject = normalizeProjectInput(projectInput);

    if (!normalizedProject) {
      setAddProjectError("Type a project path in the format group/project.");
      return;
    }

    if (!isValidProjectPath(normalizedProject)) {
      setAddProjectError(
        "Invalid format. Use group/project, group/subgroup/project, or paste a GitLab URL.",
      );
      return;
    }

    if (containsItemIgnoreCase(projects, normalizedProject)) {
      setAddProjectError("Project already added.");
      return;
    }

    onAddProject(normalizedProject);
    setAddProjectError(null);
    onClose();
  }

  return (
    <CollectFormModal
      open={open}
      onClose={onClose}
      title="Add project"
      subtitle="Use group/project, group/subgroup/project, or paste a GitLab URL."
      initialFocusRef={addProjectInputRef}
      onConfirm={handleConfirmAddProject}
    >
      <FormInput
        id="gitlab-collect-project-input"
        ref={addProjectInputRef}
        label="Project path"
        value={projectInput}
        onChange={(event) => {
          setProjectInput(event.target.value);
          if (addProjectError) setAddProjectError(null);
        }}
        placeholder="group/project or paste a GitLab URL"
        error={addProjectError ?? undefined}
      />
    </CollectFormModal>
  );
}

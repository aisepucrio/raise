import { useEffect, useRef, useState } from "react";

import { CollectFormModal } from "@/components/collect";
import { FormInput } from "@/components/form";
import { parseGithubUrl } from "@/sources/shared/parseCollectUrl";
import { containsItemIgnoreCase } from "@/sources/shared/CollectShared";

type GithubCollectModalProps = {
  open: boolean;
  repositories: readonly string[];
  onClose: () => void;
  onAddRepository: (repository: string) => void;
};

// Extracts "owner/repo" from a GitHub URL or returns plain text as-is.
function normalizeRepositoryInput(value: string): string {
  return parseGithubUrl(value) ?? value.trim().replace(/\/+$/, "");
}

// Validates "owner/repo" format.
function isValidRepositoryName(value: string) {
  return /^[^/\s]+\/[^/\s]+$/.test(value);
}

export default function GithubCollectModal({
  open,
  repositories,
  onClose,
  onAddRepository,
}: GithubCollectModalProps) {
  const addRepositoryInputRef = useRef<HTMLInputElement | null>(null);
  const [repositoryInput, setRepositoryInput] = useState("");
  const [addRepositoryError, setAddRepositoryError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (open) return;
    setRepositoryInput("");
    setAddRepositoryError(null);
  }, [open]);

  function handleConfirmAddRepository() {
    const normalizedRepository = normalizeRepositoryInput(repositoryInput);

    if (!normalizedRepository) {
      setAddRepositoryError("Type a repository in the format owner/repo.");
      return;
    }

    if (!isValidRepositoryName(normalizedRepository)) {
      setAddRepositoryError("Invalid format. Use owner/repo or paste a GitHub URL.");
      return;
    }

    if (containsItemIgnoreCase(repositories, normalizedRepository)) {
      setAddRepositoryError("Repository already added.");
      return;
    }

    onAddRepository(normalizedRepository);
    setAddRepositoryError(null);
    onClose();
  }

  return (
    <CollectFormModal
      open={open}
      onClose={onClose}
      title="Add repository"
      subtitle="Use owner/repo or paste a GitHub URL."
      initialFocusRef={addRepositoryInputRef}
      onConfirm={handleConfirmAddRepository}
    >
      <FormInput
        id="github-collect-repository-input"
        ref={addRepositoryInputRef}
        label="Repository"
        value={repositoryInput}
        onChange={(event) => {
          setRepositoryInput(event.target.value);
          if (addRepositoryError) setAddRepositoryError(null);
        }}
        placeholder="owner/repo or paste a GitHub URL"
        error={addRepositoryError ?? undefined}
      />
    </CollectFormModal>
  );
}

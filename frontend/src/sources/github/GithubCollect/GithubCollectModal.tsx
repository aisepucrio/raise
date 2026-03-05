import { useEffect, useRef, useState } from "react";

import { CollectFormModal } from "@/components/collect";
import { FormInput } from "@/components/form";
import { containsItemIgnoreCase } from "@/sources/shared/CollectShared";

type GithubCollectModalProps = {
  open: boolean;
  repositories: readonly string[];
  onClose: () => void;
  onAddRepository: (repository: string) => void;
};

// Normalize user input to extract "owner/repo" from URLs or raw text.
function normalizeRepositoryInput(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/\/+$/, "");
}

// Validate "owner/repo" format.
function isValidRepositoryName(value: string) {
  return /^[^/\s]+\/[^/\s]+$/.test(value);
}

export default function GithubCollectModal({
  open,
  repositories,
  onClose,
  onAddRepository,
}: GithubCollectModalProps) {
  // Local input state and error message.
  const addRepositoryInputRef = useRef<HTMLInputElement | null>(null);
  const [repositoryInput, setRepositoryInput] = useState("");
  const [addRepositoryError, setAddRepositoryError] = useState<string | null>(
    null,
  );

  // Reset state when modal closes.
  useEffect(() => {
    if (open) return;

    setRepositoryInput("");
    setAddRepositoryError(null);
  }, [open]);

  // Validate and confirm repository addition.
  function handleConfirmAddRepository() {
    const normalizedRepository = normalizeRepositoryInput(repositoryInput);

    if (!normalizedRepository) {
      setAddRepositoryError("Type a repository in the format owner/repo.");
      return;
    }

    if (!isValidRepositoryName(normalizedRepository)) {
      setAddRepositoryError("Invalid format. Use owner/repo.");
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
      {/* Repository input field */}
      <FormInput
        id="github-collect-repository-input"
        ref={addRepositoryInputRef}
        label="Repository"
        value={repositoryInput}
        onChange={(event) => {
          setRepositoryInput(event.target.value);
          if (addRepositoryError) setAddRepositoryError(null);
        }}
        placeholder="owner/repo"
        error={addRepositoryError ?? undefined}
      />
    </CollectFormModal>
  );
}

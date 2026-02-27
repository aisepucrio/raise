import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { Button } from "@/components/button";
import { FormInput } from "@/components/form";
import { ModalShell } from "@/components/modal-shell";
import { containsItemIgnoreCase } from "@/sources/shared/CollectShared";

type GithubCollectModalProps = {
  open: boolean;
  repositories: readonly string[];
  onClose: () => void;
  onAddRepository: (repository: string) => void;
};

// Normaliza a entrada do usuário para extrair o formato "owner/repo" de URLs ou entradas com espaços
function normalizeRepositoryInput(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/\/+$/, "");
}

// Verifica se a string segue o formato "owner/repo"
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

  function handleRepositoryInputKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    handleConfirmAddRepository();
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Add repository"
      subtitle="Use owner/repo or paste a GitHub URL."
      initialFocusRef={addRepositoryInputRef}
    >
      <div>
        <FormInput
          id="github-collect-repository-input"
          ref={addRepositoryInputRef}
          label="Repository"
          value={repositoryInput}
          onChange={(event) => {
            setRepositoryInput(event.target.value);
            if (addRepositoryError) setAddRepositoryError(null);
          }}
          onKeyDown={handleRepositoryInputKeyDown}
          placeholder="owner/repo"
          error={addRepositoryError ?? undefined}
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button
            size="sm"
            fullWidth={false}
            variant="selectable"
            selected={false}
            text="Cancel"
            onClick={onClose}
          />
          <Button
            size="sm"
            fullWidth={false}
            text="Add"
            onClick={handleConfirmAddRepository}
          />
        </div>
      </div>
    </ModalShell>
  );
}

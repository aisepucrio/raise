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
  // estado local do input e mensagem de erro.
  const addRepositoryInputRef = useRef<HTMLInputElement | null>(null);
  const [repositoryInput, setRepositoryInput] = useState("");
  const [addRepositoryError, setAddRepositoryError] = useState<string | null>(
    null,
  );

  // limpa estado quando o modal é fechado.
  useEffect(() => {
    if (open) return;

    setRepositoryInput("");
    setAddRepositoryError(null);
  }, [open]);

  // valida e confirma a inclusão de repositório.
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
      {/* campo único de entrada do repositório */}
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

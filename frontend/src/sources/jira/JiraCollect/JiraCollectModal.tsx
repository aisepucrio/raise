import { useEffect, useRef, useState } from "react";

import { CollectFormModal } from "@/components/collect";
import { FormInput } from "@/components/form";
import type { JiraProject } from "@/data/modules/jira/jiraService";
import { containsItemIgnoreCase } from "@/sources/shared/CollectShared";

export type JiraCollectModalProps = {
  open: boolean;
  projects: readonly JiraProject[];
  onClose: () => void;
  onAddProject: (project: JiraProject) => void;
};

// Normaliza o domínio informado pelo usuário, removendo protocolo e barra final.
function normalizeJiraDomainInput(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

// Normaliza a chave do projeto removendo espaços extras.
function normalizeJiraProjectKeyInput(value: string) {
  return value.trim();
}

// monta uma chave unica para comparar duplicidade entre projetos.
function buildProjectIdentifier(jiraDomain: string, projectKey: string) {
  return `${jiraDomain}/${projectKey}`;
}

export default function JiraCollectModal({
  open,
  projects,
  onClose,
  onAddProject,
}: JiraCollectModalProps) {
  // estados locais dos dois campos e erro compartilhado.
  const jiraDomainInputRef = useRef<HTMLInputElement | null>(null);
  const [jiraDomainInput, setJiraDomainInput] = useState("");
  const [jiraProjectKeyInput, setJiraProjectKeyInput] = useState("");
  const [addProjectError, setAddProjectError] = useState<string | null>(null);

  // reseta os campos ao fechar o modal.
  useEffect(() => {
    if (open) return;

    setJiraDomainInput("");
    setJiraProjectKeyInput("");
    setAddProjectError(null);
  }, [open]);

  // valida domínio/chave e adiciona o projeto.
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
      {/* bloco com os dois campos obrigatórios do jira */}
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

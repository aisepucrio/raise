import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CollectActions,
  CollectDateSection,
  CollectHeader,
  CollectTagsSection,
  CollectWrapper,
} from "@/components/collect";
import { useJiraCollectMutation } from "@/data/modules/jira/jiraMutations";
import type {
  JiraCollectBody,
  JiraProject,
} from "@/data/modules/jira/jiraService";
import {
  mapItemsToCollectTags,
  runCollectWithFeedback,
} from "@/sources/shared/CollectShared";
import JiraCollectModal from "./JiraCollectModal";

export default function JiraCollect() {
  // Redireciona para jobs já com source=jira após iniciar a coleta.
  const navigate = useNavigate();
  // Mutation responsável por enviar o payload de projetos para o endpoint Jira.
  const collectMutation = useJiraCollectMutation();

  // Lista de projetos selecionados no formato { jira_domain, project_key }.
  const [projects, setProjects] = useState<JiraProject[]>([]);
  // Filtro de período opcional enviado ao backend.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Estado do modal que adiciona novos projetos.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Adiciona um projeto já validado pelo modal.
  function handleAddProject(project: JiraProject) {
    setProjects((currentProjects) => [...currentProjects, project]);
  }

  // Remove um item exato da lista comparando domínio + project key.
  function handleRemoveProject(projectToRemove: JiraProject) {
    setProjects((currentProjects) =>
      currentProjects.filter(
        (project) =>
          !(
            project.jira_domain === projectToRemove.jira_domain &&
            project.project_key === projectToRemove.project_key
          ),
      ),
    );
  }

  // Monta o payload final da coleta Jira e executa a mutation.
  async function handleCollect() {
    // Quando datas não são preenchidas, a coleta roda para todo o período disponível.
    const payload: JiraCollectBody = {
      projects,
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    };

    await runCollectWithFeedback({
      execute: () => collectMutation.mutateAsync(payload),
      successDescription: "Jira collection started successfully.",
      errorFallbackMessage: "Failed to start Jira collection.",
      source: "jira",
      navigate,
    });
  }

  // Converte projetos para o formato de tags exibidas no bloco de tags.
  const projectTags = mapItemsToCollectTags(
    projects,
    (project) => `${project.jira_domain}/${project.project_key}`,
    handleRemoveProject,
  );

  return (
    <>
      {/* Estrutura visual compartilhada: cabeçalho, lista de projetos, datas e submit. */}
      <CollectWrapper>
        {/* Header principal com título, descrição e ação de adicionar item */}
        <CollectHeader
          title="Jira Collect"
          description="Configure projects and optional date range."
          addButtonText="Add project"
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {/* Lista de itens adicionados (repositórios/projetos/tags) */}
        <CollectTagsSection
          tagsHeading={`Projects (${projects.length})`}
          tags={projectTags}
          emptyTagsMessage='No projects added yet. Click the "Add project" button above to get started.'
        />

        {/* Filtro de data compartilhado e aviso contextual */}
        <CollectDateSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          dateFilterIdPrefix="jira-collect"
          dateWarningMessage="Leaving both date fields empty will mine data from the entire period."
        />

        {/* Ação final de disparar a coleta */}
        <CollectActions
          collectButtonText="Collect"
          collectPendingButtonText="Collecting..."
          onCollect={() => void handleCollect()}
          isCollectPending={collectMutation.isPending}
          isCollectDisabled={collectMutation.isPending || projects.length === 0}
        />
      </CollectWrapper>

      {/* Modal específico do Jira para inclusão de domínio + chave de projeto. */}
      <JiraCollectModal
        open={isAddModalOpen}
        projects={projects}
        onClose={() => setIsAddModalOpen(false)}
        onAddProject={handleAddProject}
      />
    </>
  );
}

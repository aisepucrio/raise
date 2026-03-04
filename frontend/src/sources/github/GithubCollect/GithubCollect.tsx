import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CollectActions,
  CollectDateSection,
  CollectHeader,
  CollectTagsSection,
  CollectWrapper,
} from "@/components/collect";
import { useGithubCollectMutation } from "@/data/modules/github/githubMutations";
import type { GithubCollectBody } from "@/data/modules/github/githubService";
import {
  mapItemsToCollectTags,
  runCollectWithFeedback,
} from "@/sources/shared/CollectShared";
import GithubCollectModal from "./GithubCollectModal";
import {
  GithubCollectTypesSection,
  type GithubOptionalCollectType,
} from "./GithubCollectTypesSection";

// Formata a data para o formato ISO exigido pela API do GitHub.
function formatDateGitHub(dateStr: string) {
  if (!dateStr) return undefined;

  const date = new Date(dateStr);
  date.setHours(13, 42, 0, 888);

  return date.toISOString();
}

export default function GithubCollect() {
  // Redireciona para a tela de jobs mantendo o contexto da source atual.
  const navigate = useNavigate();
  // Dispara a coleta no endpoint de GitHub e invalida a listagem de jobs ao concluir.
  const collectMutation = useGithubCollectMutation();

  // Repositórios no formato owner/repo adicionados no modal.
  const [repositories, setRepositories] = useState<string[]>([]);
  // Janela opcional de datas enviada para limitar a coleta.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // tipos extras selecionados no bloco de scope.
  const [selectedOptionalTypes, setSelectedOptionalTypes] = useState<
    GithubOptionalCollectType[]
  >([]);
  // Controla abertura do modal de inclusão de repositório.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Insere um novo repositório já normalizado/validado pelo modal.
  function handleAddRepository(normalizedRepository: string) {
    setRepositories((currentRepositories) => [
      ...currentRepositories,
      normalizedRepository,
    ]);
  }

  // Remove um repositório específico da lista atual.
  function handleRemoveRepository(repositoryToRemove: string) {
    setRepositories((currentRepositories) =>
      currentRepositories.filter(
        (repository) => repository !== repositoryToRemove,
      ),
    );
  }

  // Monta o payload final e executa a mutation de coleta.
  async function handleCollect() {
    // `metadata` sempre vai junto; tipos extras entram conforme a seleção do usuário.
    const payload: GithubCollectBody = {
      repositories,
      depth: "basic",
      collect_types: ["metadata", ...selectedOptionalTypes],
      ...(startDate ? { start_date: formatDateGitHub(startDate) } : {}),
      ...(endDate ? { end_date: formatDateGitHub(endDate) } : {}),
    };

    await runCollectWithFeedback({
      execute: () => collectMutation.mutateAsync(payload),
      successDescription: "GitHub collection started successfully.",
      errorFallbackMessage: "Failed to start GitHub collection.",
      source: "github",
      navigate,
    });
  }

  // Adapta a lista de repositórios para o formato de tags removíveis.
  const repositoryTags = mapItemsToCollectTags(
    repositories,
    (repository) => repository,
    handleRemoveRepository,
  );

  return (
    <>
      {/* Estrutura visual base compartilhada pelos collects (header, tags, datas e botão de submit). */}
      <CollectWrapper>
        {/* Header principal com título, descrição e ação de adicionar item */}
        <CollectHeader
          title="GitHub Collect"
          description="Configure repositories, optional date range and collection types."
          addButtonText="Add repository"
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {/* Lista de itens adicionados (repositórios/projetos/tags) */}
        <CollectTagsSection
          tagsHeading={`Repositories (${repositories.length})`}
          tags={repositoryTags}
          emptyTagsMessage='No repositories added yet. Click the "Add repository" button above to get started.'
        />

        {/* Filtro de data compartilhado e aviso contextual */}
        <CollectDateSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          dateFilterIdPrefix="github-collect"
          dateWarningMessage="Leaving both date fields empty will mine data from the entire period."
        />

        {/* Área de extensão para conteúdo específico do source */}
        <GithubCollectTypesSection onOptionalTypesChange={setSelectedOptionalTypes} />

        {/* Ação final de disparar a coleta */}
        <CollectActions
          collectButtonText="Collect"
          collectPendingButtonText="Collecting..."
          onCollect={() => void handleCollect()}
          isCollectPending={collectMutation.isPending}
          isCollectDisabled={collectMutation.isPending || repositories.length === 0}
        />
      </CollectWrapper>

      <GithubCollectModal
        open={isAddModalOpen}
        repositories={repositories}
        onClose={() => setIsAddModalOpen(false)}
        onAddRepository={handleAddRepository}
      />
    </>
  );
}

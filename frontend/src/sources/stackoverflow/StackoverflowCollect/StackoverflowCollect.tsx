import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CollectActions,
  CollectDateSection,
  CollectHeader,
  CollectTagsSection,
  CollectWrapper,
} from "@/components/collect";
import {
  useStackOverflowCollectAdvancedMutation,
  useStackOverflowCollectMutation,
} from "@/data/modules/stackoverflow/stackoverflowMutations";
import type {
  StackOverflowAdvancedCollectBody,
  StackOverflowCollectBody,
} from "@/data/modules/stackoverflow/stackoverflowService";
import {
  mapItemsToCollectTags,
  runCollectWithFeedback,
} from "@/sources/shared/CollectShared";
import {
  StackoverflowAdvancedFiltersSection,
  type StackoverflowAdvancedFiltersSectionState,
} from "./StackoverflowAdvancedFiltersSection";
import StackoverflowCollectModal from "./StackoverflowCollectModal";

export default function StackoverflowCollect() {
  // Redireciona para jobs com o contexto da source ao concluir a action.
  const navigate = useNavigate();
  // Coleta padrão (sem endpoint advanced).
  const collectMutation = useStackOverflowCollectMutation();
  // Coleta avançada (endpoint /collect/advanced/ + filtros opcionais).
  const collectAdvancedMutation = useStackOverflowCollectAdvancedMutation();

  // Tags opcionais usadas para restringir a coleta.
  const [tags, setTags] = useState<string[]>([]);
  // Datas obrigatórias para Stack Overflow.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // espelha o estado do componente de filtros avançados.
  const [advancedFiltersState, setAdvancedFiltersState] =
    useState<StackoverflowAdvancedFiltersSectionState>({
      enabled: false,
      filters: undefined,
    });
  // Abre/fecha modal de inclusão de tags.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // A UI usa um único estado de loading combinando os dois caminhos de coleta.
  const isCollectPending =
    collectMutation.isPending || collectAdvancedMutation.isPending;

  // Adiciona uma nova tag à lista local.
  function handleAddTag(tag: string) {
    setTags((currentTags) => [...currentTags, tag]);
  }

  // Remove uma tag específica da lista local.
  function handleRemoveTag(tagToRemove: string) {
    setTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));
  }

  // Monta payload e decide entre fluxo default ou advanced.
  async function handleCollect() {
    // Payload base comum aos modos default e advanced.
    const basePayload: StackOverflowCollectBody = {
      options: ["collect_questions"],
      start_date: startDate,
      end_date: endDate,
      ...(tags.length > 0 ? { tags: tags.join(";") } : {}),
    };

    await runCollectWithFeedback({
      execute: async () => {
        // Inicia a coleta no endpoint padrão ou avançado, dependendo do modo selecionado.
        if (advancedFiltersState.enabled) {
          // HARDCODE TEMPORARIO: QUANDO ADVANCED ESTA ATIVO, O SO CHAMA /COLLECT/ADVANCED.
          // MOTIVO: COMPATIBILIDADE COM A IMPLEMENTACAO LEGADA.
          // FUTURO: MERGEAR TUDO NO /COLLECT COM PAYLOAD.
          const advancedPayload: StackOverflowAdvancedCollectBody = {
            ...basePayload,
            mode: "advanced",
            ...(advancedFiltersState.filters
              ? { filters: advancedFiltersState.filters }
              : {}),
          };

          await collectAdvancedMutation.mutateAsync(advancedPayload);
          return;
        }

        await collectMutation.mutateAsync(basePayload);
      },
      successDescription: "Stack Overflow collection started successfully.",
      errorFallbackMessage: "Failed to start Stack Overflow collection.",
      source: "stackoverflow",
      navigate,
    });
  }

  // Adapta tags para o formato de itens removíveis consumido pelo bloco de tags.
  const tagItems = mapItemsToCollectTags(tags, (tag) => tag, handleRemoveTag);

  return (
    <>
      {/* Estrutura visual base compartilhada (título, tags, datas e botão de coleta). */}
      <CollectWrapper>
        {/* Header principal com título, descrição e ação de adicionar item */}
        <CollectHeader
          title="Stack Overflow Collect"
          description="Configure tags, required date range and optional advanced filters."
          addButtonText="Add tag"
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {/* Lista de itens adicionados (repositórios/projetos/tags) */}
        <CollectTagsSection
          tagsHeading={`Tags (${tags.length})`}
          tags={tagItems}
          emptyTagsMessage='No tags added yet. You can collect without tags or click "Add tag" to target specific tags.'
        />

        {/* Filtro de data compartilhado e aviso contextual */}
        <CollectDateSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          dateFilterIdPrefix="stackoverflow-collect"
          dateWarningMessage="Start and finish dates are required for Stack Overflow."
        />

        {/* Área de extensão para conteúdo específico do source */}
        <StackoverflowAdvancedFiltersSection onChange={setAdvancedFiltersState} />

        {/* Ação final de disparar a coleta */}
        <CollectActions
          collectButtonText="Collect"
          collectPendingButtonText="Collecting..."
          onCollect={() => void handleCollect()}
          isCollectPending={isCollectPending}
          isCollectDisabled={isCollectPending || !startDate || !endDate}
        />
      </CollectWrapper>

      {/* Modal específico para adicionar tags opcionais de Stack Overflow. */}
      <StackoverflowCollectModal
        open={isAddModalOpen}
        tags={tags}
        onClose={() => setIsAddModalOpen(false)}
        onAddTag={handleAddTag}
      />
    </>
  );
}

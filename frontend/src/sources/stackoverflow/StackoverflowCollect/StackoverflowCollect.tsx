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
  type StackOverflowAdvancedCollectBody,
  type StackOverflowCollectBody,
} from "@/data";
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
  // Redirects for jobs with the context of the source to concluir the action.
  const navigate = useNavigate();
  // collection standard (without endpoint advanced).
  const collectMutation = useStackOverflowCollectMutation();
  // collection advanced (endpoint /collect/advanced/ + filters optional).
  const collectAdvancedMutation = useStackOverflowCollectAdvancedMutation();

  // Tags optional usadas for restringir the collection.
  const [tags, setTags] = useState<string[]>([]);
  // dates required for Stack Overflow.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // espelha the state of the component of filters advanced.
  const [advancedFiltersState, setAdvancedFiltersState] =
    useState<StackoverflowAdvancedFiltersSectionState>({
      enabled: false,
      filters: undefined,
    });
  // Abre/fecha modal of inclusion of tags.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // the UI usa the single state of loading combinando the dois caminhos of collection.
  const isCollectPending =
    collectMutation.isPending || collectAdvancedMutation.isPending;

  // adds the nova tag to list local.
  function handleAddTag(tag: string) {
    setTags((currentTags) => [...currentTags, tag]);
  }

  // removes the tag specific of the list local.
  function handleRemoveTag(tagToRemove: string) {
    setTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));
  }

  // Builds payload and decide between fluxo default ou advanced.
  async function handleCollect() {
    // Payload base comum to the modes default and advanced.
    const basePayload: StackOverflowCollectBody = {
      options: ["collect_questions"],
      start_date: startDate,
      end_date: endDate,
      ...(tags.length > 0 ? { tags: tags.join(";") } : {}),
    };

    await runCollectWithFeedback({
      execute: async () => {
        // starts the collection in the endpoint standard ou advanced, dependendo of the mode selected.
        if (advancedFiltersState.enabled) {
          // HARDCODE TEMPORARIO: when ADVANCED ESTA ATIVO, the SO Calls /COLLECT/ADVANCED.
          // MOTIVO: COMPATIBILIDADE with the IMPLEMENTACAO LEGADA.
          // FUTURO: MERGEAR TUDO in the /COLLECT with PAYLOAD.
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

  // adapts tags for the format of items removable consumed pelo block of tags.
  const tagItems = mapItemsToCollectTags(tags, (tag) => tag, handleRemoveTag);

  return (
    <>
      {/* Estrutura visual base shared (title, tags, dates and button of collection). */}
      <CollectWrapper>
        {/* Header main with title, description and action of add item */}
        <CollectHeader
          title="Stack Overflow Collect"
          description="Configure tags, required date range and optional advanced filters."
          addButtonText="Add tag"
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {/* list of items added (repositories/projects/tags) */}
        <CollectTagsSection
          tagsHeading={`Tags (${tags.length})`}
          tags={tagItems}
          emptyTagsMessage='No tags added yet. You can collect without tags or click "Add tag" to target specific tags.'
        />

        {/* filter of date shared and warning contextual */}
        <CollectDateSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          dateFilterIdPrefix="stackoverflow-collect"
          dateWarningMessage="Start and finish dates are required for Stack Overflow."
        />

        {/* area of extension for content specific of the source */}
        <StackoverflowAdvancedFiltersSection onChange={setAdvancedFiltersState} />

        {/* final action to trigger collection */}
        <CollectActions
          collectButtonText="Collect"
          collectPendingButtonText="Collecting..."
          onCollect={() => void handleCollect()}
          isCollectPending={isCollectPending}
          isCollectDisabled={isCollectPending || !startDate || !endDate}
        />
      </CollectWrapper>

      {/* Modal specific for add tags optional of Stack Overflow. */}
      <StackoverflowCollectModal
        open={isAddModalOpen}
        tags={tags}
        onClose={() => setIsAddModalOpen(false)}
        onAddTag={handleAddTag}
      />
    </>
  );
}

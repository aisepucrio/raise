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
  // Redirects to jobs with source context after the action completes.
  const navigate = useNavigate();
  // Standard collection (without advanced endpoint).
  const collectMutation = useStackOverflowCollectMutation();
  // Advanced collection (endpoint /collect/advanced/ + optional filters).
  const collectAdvancedMutation = useStackOverflowCollectAdvancedMutation();

  // Optional tags used to narrow collection.
  const [tags, setTags] = useState<string[]>([]);
  // dates required for Stack Overflow.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Mirrors the state from the advanced-filters component.
  const [advancedFiltersState, setAdvancedFiltersState] =
    useState<StackoverflowAdvancedFiltersSectionState>({
      enabled: false,
      filters: undefined,
    });
  // Opens/closes the tag-add modal.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // The UI uses one loading state combining both collection paths.
  const isCollectPending =
    collectMutation.isPending || collectAdvancedMutation.isPending;

  // Adds a new tag to local state.
  function handleAddTag(tag: string) {
    setTags((currentTags) => [...currentTags, tag]);
  }

  // Removes a specific tag from local state.
  function handleRemoveTag(tagToRemove: string) {
    setTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));
  }

  // Builds payload and chooses between default and advanced flow.
  async function handleCollect() {
    // Common base payload for default and advanced modes.
    const basePayload: StackOverflowCollectBody = {
      options: ["collect_questions"],
      start_date: startDate,
      end_date: endDate,
      ...(tags.length > 0 ? { tags: tags.join(";") } : {}),
    };

    await runCollectWithFeedback({
      execute: async () => {
        // Starts collection on standard or advanced endpoint, based on selected mode.
        if (advancedFiltersState.enabled) {
          // TEMPORARY HARDCODE: when advanced mode is on, SO calls /COLLECT/ADVANCED.
          // REASON: compatibility with legacy implementation.
          // FUTURE: merge everything into /COLLECT using payload only.
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

  // Adapts tags to the removable-item format consumed by the tags block.
  const tagItems = mapItemsToCollectTags(tags, (tag) => tag, handleRemoveTag);

  return (
    <>
      {/* Shared base visual structure (title, tags, dates, collect button). */}
      <CollectWrapper>
        {/* Main header with title, description, and add-item action. */}
        <CollectHeader
          title="Stack Overflow Collect"
          description="Configure tags, required date range and optional advanced filters."
          addButtonText="Add tag"
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {/* List of added items (repositories/projects/tags). */}
        <CollectTagsSection
          tagsHeading={`Tags (${tags.length})`}
          tags={tagItems}
          emptyTagsMessage='No tags added yet. You can collect without tags or click "Add tag" to target specific tags.'
        />

        {/* Shared date filter and contextual warning. */}
        <CollectDateSection
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          dateFilterIdPrefix="stackoverflow-collect"
          dateWarningMessage="Start and finish dates are required for Stack Overflow."
        />

        {/* Extension area for source-specific content. */}
        <StackoverflowAdvancedFiltersSection onChange={setAdvancedFiltersState} />

        {/* Final action that starts collection. */}
        <CollectActions
          collectButtonText="Collect"
          collectPendingButtonText="Collecting..."
          onCollect={() => void handleCollect()}
          isCollectPending={isCollectPending}
          isCollectDisabled={isCollectPending || !startDate || !endDate}
        />
      </CollectWrapper>

      {/* Stack Overflow-specific modal to add optional tags. */}
      <StackoverflowCollectModal
        open={isAddModalOpen}
        tags={tags}
        onClose={() => setIsAddModalOpen(false)}
        onAddTag={handleAddTag}
      />
    </>
  );
}

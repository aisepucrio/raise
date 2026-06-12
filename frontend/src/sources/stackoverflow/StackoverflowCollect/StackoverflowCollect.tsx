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
  useStackOverflowCollectMutation,
  type StackOverflowCollectBody,
} from "@/data";
import { runCollectWithFeedback } from "@/sources/shared/CollectShared";
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

  // Optional tags used to narrow collection.
  const [tags, setTags] = useState<string[]>([]);
  // dates required for Stack Overflow.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Mirrors the state from the advanced-filters component.
  const [advancedFiltersState, setAdvancedFiltersState] =
    useState<StackoverflowAdvancedFiltersSectionState>({
      enabled: false,
      filters: {},
    });
  // Opens/closes the tag-add modal.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Adds a new tag to local state.
  function handleAddTag(tag: string) {
    setTags((currentTags) => [...currentTags, tag]);
  }

  // Removes a specific tag from local state.
  function handleRemoveTag(tagToRemove: string) {
    setTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));
  }

  // Builds the standardized collect payload.
  async function handleCollect() {
    const payload: StackOverflowCollectBody = {
      targets: tags,
      collect_types: ["questions"],
      start_date: startDate,
      end_date: endDate,
      filters: advancedFiltersState.filters,
      options: {
        mode: advancedFiltersState.enabled ? "advanced" : "default",
      },
    };

    await runCollectWithFeedback({
      execute: () => collectMutation.mutateAsync(payload),
      source: "stackoverflow",
      navigate,
    });
  }

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
          title="Tags"
          items={tags}
          onRemoveItem={handleRemoveTag}
          emptyMessage='No tags added yet. You can collect without tags or click "Add tag" to target specific tags.'
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
          onCollect={() => void handleCollect()}
          isCollectPending={collectMutation.isPending}
          isCollectDisabled={collectMutation.isPending || !startDate || !endDate}
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

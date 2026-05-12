import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CollectActions,
  CollectDateSection,
  CollectHeader,
  CollectTagsSection,
  CollectWrapper,
} from "@/components/collect";

import RedditCollectModal from "./RedditCollectModal";

// MOCK por enquanto 
async function fakeRedditCollect() {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

export default function RedditCollect() {
  const navigate = useNavigate();

  // Ex: subreddits adicionados
  const [subreddits, setSubreddits] = useState<string[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


  function handleAddSubreddit(normalizedSubreddit: string) {
  setSubreddits((current) => [
    ...current,
    normalizedSubreddit,
  ]);
  }

  function handleRemoveSubreddit(sub: string) {
    setSubreddits((prev) => prev.filter((s) => s !== sub));
  }

  async function handleCollect() {
    await fakeRedditCollect();

    navigate("/jobs?source=reddit");
  }

  const subredditTags = subreddits.map((sub) => ({
    id: sub,
    label: sub,
    onRemove: () => handleRemoveSubreddit(sub),
  }));

  return (
  <>
    <CollectWrapper>
      <CollectHeader
        title="Reddit Collect"
        description="Add subreddits and optionally filter by date."
        addButtonText="Add subreddit"
        onAddClick={() => setIsAddModalOpen(true)}
      />

      <CollectTagsSection
        tagsHeading={`Subreddits (${subreddits.length})`}
        tags={subredditTags}
        emptyTagsMessage="No subreddits added yet."
      />

      <CollectDateSection
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        dateFilterIdPrefix="reddit-collect"
        dateWarningMessage="Leaving empty will fetch all available data."
      />

      <CollectActions
        collectButtonText="Collect"
        collectPendingButtonText="Collecting..."
        onCollect={() => void handleCollect()}
        isCollectPending={false}
        isCollectDisabled={subreddits.length === 0}
      />
    </CollectWrapper>

    <RedditCollectModal
    open={isAddModalOpen}
    subreddits={subreddits}
    onClose={() => setIsAddModalOpen(false)}
    onAddSubreddit={handleAddSubreddit}
/>
  </>
);
}
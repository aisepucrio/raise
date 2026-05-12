import { useEffect, useRef, useState } from "react";

import { CollectFormModal } from "@/components/collect";
import { FormInput } from "@/components/form";
import { containsItemIgnoreCase } from "@/sources/shared/CollectShared";

type RedditCollectModalProps = {
  open: boolean;
  subreddits: readonly string[];
  onClose: () => void;
  onAddSubreddit: (subreddit: string) => void;
};

// Normalize user input (remove /r/ or reddit URL)
function normalizeSubredditInput(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/reddit\.com\/r\//i, "")
    .replace(/^reddit\.com\/r\//i, "")
    .replace(/^r\//i, "")
    .replace(/\/+$/, "");
}

// Validate subreddit format
function isValidSubredditName(value: string) {
  return /^[A-Za-z0-9_]+$/.test(value);
}

export default function RedditCollectModal({
  open,
  subreddits,
  onClose,
  onAddSubreddit,
}: RedditCollectModalProps) {
  const addSubredditInputRef = useRef<HTMLInputElement | null>(null);
  const [subredditInput, setSubredditInput] = useState("");
  const [addSubredditError, setAddSubredditError] = useState<string | null>(null);

  useEffect(() => {
    if (open) return;

    setSubredditInput("");
    setAddSubredditError(null);
  }, [open]);

  function handleConfirmAddSubreddit() {
    const normalizedSubreddit = normalizeSubredditInput(subredditInput);

    if (!normalizedSubreddit) {
      setAddSubredditError("Type a subreddit name.");
      return;
    }

    if (!isValidSubredditName(normalizedSubreddit)) {
      setAddSubredditError("Invalid subreddit name.");
      return;
    }

    if (containsItemIgnoreCase(subreddits, normalizedSubreddit)) {
      setAddSubredditError("Subreddit already added.");
      return;
    }

    onAddSubreddit(normalizedSubreddit);
    setAddSubredditError(null);
    onClose();
  }

  return (
    <CollectFormModal
      open={open}
      onClose={onClose}
      title="Add subreddit"
      subtitle="Type a subreddit name or paste a Reddit URL."
      initialFocusRef={addSubredditInputRef}
      onConfirm={handleConfirmAddSubreddit}
    >
      <FormInput
        id="reddit-collect-subreddit-input"
        ref={addSubredditInputRef}
        label="Subreddit"
        value={subredditInput}
        onChange={(event) => {
          setSubredditInput(event.target.value);
          if (addSubredditError) setAddSubredditError(null);
        }}
        placeholder="programming"
        error={addSubredditError ?? undefined}
      />
    </CollectFormModal>
  );
}
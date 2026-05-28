import { useEffect, useRef, useState } from "react";

import { CollectFormModal } from "@/components/collect";
import { FormInput } from "@/components/form";
import { containsItemIgnoreCase } from "@/sources/shared/CollectShared";
import { parseStackOverflowUrl } from "@/sources/shared/parseCollectUrl";

export type StackoverflowCollectModalProps = {
  open: boolean;
  tags: readonly string[];
  onClose: () => void;
  onAddTag: (tag: string) => void;
};

// Extracts a tag from a Stack Overflow tag URL, or trims plain text as-is.
function normalizeTagInput(value: string): string {
  return parseStackOverflowUrl(value) ?? value.trim();
}

export default function StackoverflowCollectModal({
  open,
  tags,
  onClose,
  onAddTag,
}: StackoverflowCollectModalProps) {
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [addTagError, setAddTagError] = useState<string | null>(null);

  useEffect(() => {
    if (open) return;
    setTagInput("");
    setAddTagError(null);
  }, [open]);

  function handleConfirmAddTag() {
    const normalizedTag = normalizeTagInput(tagInput);

    if (!normalizedTag) {
      setAddTagError("Type a tag or paste a Stack Overflow tag URL.");
      return;
    }

    if (containsItemIgnoreCase(tags, normalizedTag)) {
      setAddTagError("Tag already added.");
      return;
    }

    onAddTag(normalizedTag);
    setAddTagError(null);
    onClose();
  }

  return (
    <CollectFormModal
      open={open}
      onClose={onClose}
      title="Add tag"
      subtitle="Tags are optional and help narrow down collection."
      initialFocusRef={tagInputRef}
      onConfirm={handleConfirmAddTag}
    >
      <FormInput
        id="stackoverflow-collect-tag-input"
        ref={tagInputRef}
        label="Tag"
        value={tagInput}
        onChange={(event) => {
          setTagInput(event.target.value);
          if (addTagError) setAddTagError(null);
        }}
        placeholder="Stack Overflow tag URL or the tag name"
        error={addTagError ?? undefined}
      />
    </CollectFormModal>
  );
}

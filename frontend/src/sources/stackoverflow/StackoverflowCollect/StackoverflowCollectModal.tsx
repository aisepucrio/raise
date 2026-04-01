import { useEffect, useRef, useState } from "react";

import { CollectFormModal } from "@/components/collect";
import { FormInput } from "@/components/form";
import { containsItemIgnoreCase } from "@/sources/shared/CollectShared";

export type StackoverflowCollectModalProps = {
  open: boolean;
  tags: readonly string[];
  onClose: () => void;
  onAddTag: (tag: string) => void;
};

function normalizeTagInput(value: string) {
  return value.trim();
}

export default function StackoverflowCollectModal({
  open,
  tags,
  onClose,
  onAddTag,
}: StackoverflowCollectModalProps) {
  // Local state for tag input and error message.
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [addTagError, setAddTagError] = useState<string | null>(null);

  // Clears form state when the modal closes.
  useEffect(() => {
    if (open) return;

    setTagInput("");
    setAddTagError(null);
  }, [open]);

  // Validates duplicates and confirms tag addition.
  function handleConfirmAddTag() {
    const normalizedTag = normalizeTagInput(tagInput);

    if (!normalizedTag) {
      setAddTagError("Type a tag before adding.");
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
      {/* Tag input field. */}
      <FormInput
        id="stackoverflow-collect-tag-input"
        ref={tagInputRef}
        label="Tag"
        value={tagInput}
        onChange={(event) => {
          setTagInput(event.target.value);
          if (addTagError) setAddTagError(null);
        }}
        placeholder="reactjs"
        error={addTagError ?? undefined}
      />
    </CollectFormModal>
  );
}

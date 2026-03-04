import { useEffect, useRef, useState } from "react";

import { CollectFormModal } from "@/components/collect";
import { FormInput } from "@/components/form";
import { containsItemIgnoreCase } from "@/sources/shared/CollectShared";

type StackoverflowCollectModalProps = {
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
  // estado local da tag e erro.
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [addTagError, setAddTagError] = useState<string | null>(null);

  // limpa o formulário ao fechar o modal.
  useEffect(() => {
    if (open) return;

    setTagInput("");
    setAddTagError(null);
  }, [open]);

  // valida duplicidade e confirma adição da tag.
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
      {/* campo de entrada da tag */}
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

export type { StackoverflowCollectModalProps };

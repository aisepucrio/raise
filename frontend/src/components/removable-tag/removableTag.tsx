import { X } from "lucide-react";

type RemovableTagProps = {
  label: string;
  onRemove: () => void;
};

export function RemovableTag({ label, onRemove }: RemovableTagProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-(--color-secondary) bg-(--color-primary) px-3 py-2 text-sm text-(--color-secondary)">
      <span className="break-all">{label}</span>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="inline-flex size-5 items-center justify-center rounded-full bg-(--color-secondary-subtle) text-(--color-secondary) transition-colors hover:bg-(--color-secondary-soft)"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

export type { RemovableTagProps };

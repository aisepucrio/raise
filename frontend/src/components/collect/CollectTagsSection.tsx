import { RemovableTag } from "@/components/removable-tag";

export type CollectTagsSectionProps = {
  title: string;
  items: readonly string[];
  emptyMessage: string;
  onRemoveItem: (item: string) => void;
};

export function CollectTagsSection({
  title,
  items,
  emptyMessage,
  onRemoveItem,
}: CollectTagsSectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-(--color-secondary)">
          {title} ({items.length})
        </h3>
      </div>

      <div className="min-h-28 rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-3">
        {items.length === 0 ? (
          <div className="grid min-h-24 place-items-center rounded-md border border-dashed border-(--color-secondary-subtle) text-center text-sm text-(--color-secondary-muted)">
            {emptyMessage}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <RemovableTag
                key={item}
                label={item}
                onRemove={() => onRemoveItem(item)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { RemovableTag } from "@/components/removable-tag";

type CollectTag = {
  id: string;
  label: string;
  onRemove: () => void;
};

type CollectTagsSectionProps = {
  tagsHeading: string;
  tags: readonly CollectTag[];
  emptyTagsMessage: string;
};

export function CollectTagsSection({
  tagsHeading,
  tags,
  emptyTagsMessage,
}: CollectTagsSectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-(--color-secondary)">
          {tagsHeading}
        </h3>
      </div>

      <div className="min-h-28 rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-3">
        {tags.length === 0 ? (
          <div className="grid min-h-24 place-items-center rounded-md border border-dashed border-(--color-secondary-subtle) text-center text-sm text-(--color-secondary-muted)">
            {emptyTagsMessage}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <RemovableTag
                key={tag.id}
                label={tag.label}
                onRemove={tag.onRemove}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export type { CollectTag, CollectTagsSectionProps };

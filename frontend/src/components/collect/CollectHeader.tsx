import { Plus } from "lucide-react";

import { Button } from "@/components/button";

type CollectHeaderProps = {
  title: string;
  description: string;
  addButtonText: string;
  onAddClick: () => void;
};

export function CollectHeader({
  title,
  description,
  addButtonText,
  onAddClick,
}: CollectHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-(--color-secondary)">{title}</h2>
        <p className="text-sm text-(--color-secondary-muted)">{description}</p>
      </div>

      <Button
        size="sm"
        fullWidth={false}
        text={addButtonText}
        icon={<Plus />}
        onClick={onAddClick}
      />
    </div>
  );
}

export type { CollectHeaderProps };

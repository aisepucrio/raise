import { Loader2 } from "lucide-react";

import { Button } from "@/components/button";

export type CollectActionsProps = {
  collectButtonText: string;
  collectPendingButtonText: string;
  onCollect: () => void;
  isCollectPending: boolean;
  isCollectDisabled: boolean;
};

export function CollectActions({
  collectButtonText,
  collectPendingButtonText,
  onCollect,
  isCollectPending,
  isCollectDisabled,
}: CollectActionsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-2 pt-1">
      <Button
        fullWidth={false}
        text={isCollectPending ? collectPendingButtonText : collectButtonText}
        onClick={onCollect}
        disabled={isCollectDisabled}
        icon={isCollectPending ? <Loader2 className="animate-spin" /> : undefined}
        className="min-w-40 px-4"
      />
    </div>
  );
}

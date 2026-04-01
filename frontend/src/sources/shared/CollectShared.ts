import type { NavigateFunction } from "react-router-dom";

import { toast } from "@/components/toast";
import { getQueryErrorMessage } from "@/data";
import type { SourceId } from "@/sources";

export type CollectTagItem = {
  id: string;
  label: string;
  onRemove: () => void;
};

export type RunCollectWithFeedbackParams = {
  execute: () => Promise<unknown>;
  successDescription: string;
  errorFallbackMessage: string;
  source: SourceId;
  navigate: NavigateFunction;
};

// Checks whether a string exists in the list, ignoring case, to avoid visual duplicates.
export function containsItemIgnoreCase(
  list: readonly string[],
  value: string,
): boolean {
  const normalizedValue = value.toLowerCase();

  for (const currentItem of list) {
    const normalizedCurrentItem = currentItem.toLowerCase();

    if (normalizedCurrentItem === normalizedValue) {
      return true;
    }
  }

  return false;
}

// Adapts the list to the removable-tag format used in collect screens.
export function mapItemsToCollectTags<T>(
  items: readonly T[],
  getId: (item: T) => string,
  onRemove: (item: T) => void,
): CollectTagItem[] {
  return items.map((item) => {
    const id = getId(item);

    return {
      id,
      label: id,
      onRemove: () => onRemove(item),
    };
  });
}

// Executes collection with default success/error feedback.
export async function runCollectWithFeedback({
  execute,
  successDescription,
  errorFallbackMessage,
  source,
  navigate,
}: RunCollectWithFeedbackParams): Promise<void> {
  try {
    await execute();

    toast.success(undefined, {
      description: successDescription,
    });
    navigate(`/jobs?source=${source}`);
  } catch (error) {
    const message = getQueryErrorMessage(error, errorFallbackMessage);
    toast.error(undefined, { description: message });
  }
}

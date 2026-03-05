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

// Verifica se the string existe in the list ignorando caixa alta/baixa to avoid duplicatas visual.
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

// adapts the list for the format of tags removiveis used in the collect.
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

// executes the collection with feedback Default of success/error.
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

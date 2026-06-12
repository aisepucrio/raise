import type { NavigateFunction } from "react-router-dom";

import { toast } from "@/components/toast";
import { getQueryErrorMessage } from "@/data";
import type { SourceId } from "@/sources";

export type RunCollectWithFeedbackParams = {
  execute: () => Promise<unknown>;
  successDescription?: string;
  errorFallbackMessage?: string;
  source: SourceId;
  navigate: NavigateFunction;
};

const COLLECT_SOURCE_LABELS: Record<SourceId, string> = {
  github: "GitHub",
  jira: "Jira",
  stackoverflow: "Stack Overflow",
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

// Executes collection with default success/error feedback.
export async function runCollectWithFeedback({
  execute,
  successDescription,
  errorFallbackMessage,
  source,
  navigate,
}: RunCollectWithFeedbackParams): Promise<void> {
  const sourceLabel = COLLECT_SOURCE_LABELS[source];

  try {
    await execute();

    toast.success(undefined, {
      description:
        successDescription ?? `${sourceLabel} collection started successfully.`,
    });
    navigate(`/jobs?source=${source}`);
  } catch (error) {
    const message = getQueryErrorMessage(
      error,
      errorFallbackMessage ?? `Failed to start ${sourceLabel} collection.`,
    );
    toast.error(undefined, { description: message });
  }
}

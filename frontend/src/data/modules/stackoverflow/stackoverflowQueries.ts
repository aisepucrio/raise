import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { StackOverflowSection } from "../../api/endpoints";
import { queryKeys } from "../../query/keys";
import { stackoverflowService } from "./stackoverflowService";
import { toDateBounds } from "../shared";
import type { HookQueryOptions } from "../shared";
import type {
  StackOverflowDateRangeParams,
  StackOverflowGraphParams,
  StackOverflowOverviewParams,
  StackOverflowPreviewParams,
} from "./stackoverflowTypes";

// Hooks receive the same params as the service layer (no extra adaptation).
// Fetches Stack Overflow dashboard cards.
export function useStackOverflowOverviewQuery(
  params?: StackOverflowOverviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.stackoverflow.overview(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => stackoverflowService.getOverview(params, { signal }),
  });
}

// Fetches min/max date range for the selected question.
export function useStackOverflowDateRangeQuery(
  params?: StackOverflowDateRangeParams,
  options?: HookQueryOptions,
) {
  const isEnabled = (options?.enabled ?? true) && Boolean(params?.question_id);

  return useQuery({
    queryKey: queryKeys.stackoverflow.dateRange(params),
    enabled: isEnabled,
    queryFn: ({ signal }) => {
      if (!params) {
        throw new Error(
          "question_id is required to fetch Stack Overflow date range.",
        );
      }
      return stackoverflowService.getDateRange(params, { signal });
    },
    select: toDateBounds,
  });
}

// Convenience wrapper for components that only have `questionId`.
export function useStackOverflowDateRangeByQuestionQuery(
  questionId?: string,
  options?: HookQueryOptions,
) {
  const trimmedQuestionId = questionId?.trim();

  return useStackOverflowDateRangeQuery(
    trimmedQuestionId ? { question_id: trimmedQuestionId } : undefined,
    options,
  );
}

// Fetches Stack Overflow dashboard time series.
export function useStackOverflowGraphQuery(
  params: StackOverflowGraphParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.stackoverflow.graph(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => stackoverflowService.getGraph(params, { signal }),
  });
}

// Fetches paginated preview table data for a Stack Overflow section.
export function useStackOverflowPreviewQuery(
  section: StackOverflowSection,
  params: StackOverflowPreviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.stackoverflow.preview(section, params),
    enabled: options?.enabled,
    // Keeps current table data while filter/sort/page changes.
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      stackoverflowService.getPreview(section, params, { signal }),
  });
}

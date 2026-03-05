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

// the hooks receive the same params of the service (without layer extra of adaptstion).
// search the cards of the dashboard of the Stack Overflow.
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

// search the range minimum/maximum of dates for the question selected.
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

// convenience for components that only have `questionId`.
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

// search the series temporal of the dashboard of the Stack Overflow.
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

// search the table paginada of preview of the section of the Stack Overflow.
export function useStackOverflowPreviewQuery(
  section: StackOverflowSection,
  params: StackOverflowPreviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.stackoverflow.preview(section, params),
    enabled: options?.enabled,
    // keeps the table atual durante changes of filter/sorting/page.
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      stackoverflowService.getPreview(section, params, { signal }),
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { stackoverflowService } from "./stackoverflowService";
import type { StackOverflowCollectBody } from "./stackoverflowTypes";

// Starts Stack Overflow collection and updates the global jobs list.
export function useStackOverflowCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StackOverflowCollectBody) =>
      stackoverflowService.collect(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Exports Stack Overflow preview data in the current standard format (json).
export function useStackOverflowExportMutation() {
  return useMutation({
    mutationFn: () => stackoverflowService.exportPreview(),
  });
}

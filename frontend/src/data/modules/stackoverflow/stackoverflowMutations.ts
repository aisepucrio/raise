import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { stackoverflowService } from "./stackoverflowService";
import type {
  StackOverflowAdvancedCollectBody,
  StackOverflowCollectBody,
} from "./stackoverflowTypes";

// Starts Stack Overflow collection and updates the global jobs list.
export function useStackOverflowCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StackOverflowCollectBody) =>
      stackoverflowService.collect(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// TEMPORARY HARDCODE: this mutation exists only for /COLLECT/ADVANCED for legacy compatibility.
// FUTURE: remove this and use only the /COLLECT mutation with payload.
export function useStackOverflowCollectAdvancedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StackOverflowAdvancedCollectBody) =>
      stackoverflowService.collectAdvanced(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Exports Stack Overflow preview data in the current standard format (json).
export function useStackOverflowExportMutation() {
  return useMutation({
    mutationFn: () => stackoverflowService.exportPreview(),
  });
}

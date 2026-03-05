import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { stackoverflowService } from "./stackoverflowService";
import type {
  StackOverflowAdvancedCollectBody,
  StackOverflowCollectBody,
} from "./stackoverflowTypes";

// starts the collection of Stack Overflow and updates the list global of jobs.
export function useStackOverflowCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StackOverflowCollectBody) =>
      stackoverflowService.collect(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// HARDCODE TEMPORARIO: ESTA MUTATION EXISTE SO for the /COLLECT/ADVANCED for COMPATIBILIDADE with the IMPLEMENTACAO LEGADA.
// FUTURO: removes and use only the MUTATION of /COLLECT with PAYLOAD.
export function useStackOverflowCollectAdvancedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StackOverflowAdvancedCollectBody) =>
      stackoverflowService.collectAdvanced(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Exporta date of preview of the Stack Overflow in the current standard format (json).
export function useStackOverflowExportMutation() {
  return useMutation({
    mutationFn: () => stackoverflowService.exportPreview(),
  });
}

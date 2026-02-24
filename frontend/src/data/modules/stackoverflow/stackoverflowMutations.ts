import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { stackoverflowService } from "./stackoverflowService";
import type { StackOverflowCollectBody } from "./stackoverflowService";

// Inicia uma coleta de Stack Overflow e atualiza a lista global de jobs.
export function useStackOverflowCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StackOverflowCollectBody) =>
      stackoverflowService.collect(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Exporta dados de preview do Stack Overflow no formato padrão atual (json).
export function useStackOverflowExportMutation() {
  return useMutation({
    mutationFn: () => stackoverflowService.exportPreview(),
  });
}

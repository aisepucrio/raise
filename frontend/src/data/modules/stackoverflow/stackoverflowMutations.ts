import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { stackoverflowService } from "./stackoverflowService";
import type {
  StackOverflowAdvancedCollectBody,
  StackOverflowCollectBody,
} from "./stackoverflowTypes";

// Inicia uma coleta de Stack Overflow e atualiza a lista global de jobs.
export function useStackOverflowCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StackOverflowCollectBody) =>
      stackoverflowService.collect(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// HARDCODE TEMPORARIO: ESTA MUTATION EXISTE SO PARA O /COLLECT/ADVANCED POR COMPATIBILIDADE COM A IMPLEMENTACAO LEGADA.
// FUTURO: REMOVER E USAR APENAS A MUTATION DE /COLLECT COM PAYLOAD.
export function useStackOverflowCollectAdvancedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StackOverflowAdvancedCollectBody) =>
      stackoverflowService.collectAdvanced(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Exporta dados de preview do Stack Overflow no formato padrão atual (json).
export function useStackOverflowExportMutation() {
  return useMutation({
    mutationFn: () => stackoverflowService.exportPreview(),
  });
}

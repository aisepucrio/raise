import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { githubService } from "./githubService";
import type { GithubCollectBody, GithubExportBody } from "./githubService";

// Inicia uma coleta de GitHub e atualiza a lista global de jobs.
export function useGithubCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: GithubCollectBody) => githubService.collect(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Exporta dados de preview do GitHub no formato padrão atual (json).
export function useGithubExportMutation() {
  return useMutation({
    mutationFn: (body: GithubExportBody) => githubService.exportPreview(body),
  });
}

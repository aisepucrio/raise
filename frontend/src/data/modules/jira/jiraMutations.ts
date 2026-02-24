import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { jiraService } from "./jiraService";
import type { JiraCollectBody } from "./jiraService";

// Inicia uma coleta de Jira e atualiza a lista global de jobs.
export function useJiraCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: JiraCollectBody) => jiraService.collect(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Exporta dados de preview do Jira no formato padrão atual (json).
export function useJiraExportMutation() {
  return useMutation({
    mutationFn: () => jiraService.exportPreview(),
  });
}

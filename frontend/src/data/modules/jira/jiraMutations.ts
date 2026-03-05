import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { jiraService } from "./jiraService";
import type { JiraCollectBody } from "./jiraTypes";

// starts the collection of Jira and updates the list global of jobs.
export function useJiraCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: JiraCollectBody) => jiraService.collect(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Exporta date of preview of the Jira in the current standard format (json).
export function useJiraExportMutation() {
  return useMutation({
    mutationFn: () => jiraService.exportPreview(),
  });
}

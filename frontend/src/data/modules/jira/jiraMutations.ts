import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { jiraService } from "./jiraService";
import type { JiraCollectBody } from "./jiraTypes";

// Starts Jira collection and updates the global jobs list.
export function useJiraCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: JiraCollectBody) => jiraService.collect(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Exports Jira preview data in the current standard format (json).
export function useJiraExportMutation() {
  return useMutation({
    mutationFn: () => jiraService.exportPreview(),
  });
}

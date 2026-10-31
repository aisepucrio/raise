import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateCollectionQueries } from "../../query/invalidation";
import { jiraService } from "./jiraService";
import type { JiraCollectBody, JiraExportBody } from "./jiraTypes";
import { ExportFormat } from "@/components/preview/PreviewExportModal";

// Starts Jira collection and updates the global jobs list.
export function useJiraCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: JiraCollectBody) => jiraService.collect(body),
    onSuccess: () => invalidateCollectionQueries(queryClient),
  });
}

// Exports Jira preview data.
export function useJiraExportMutation() {
  return useMutation({
    mutationFn: (body: JiraExportBody) => jiraService.exportPreview(body),
  });
}

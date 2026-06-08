import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { gitlabService } from "./gitlabService";
import type { GitlabCollectBody, GitlabExportBody } from "./gitlabTypes";

export function useGitlabCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: GitlabCollectBody) => gitlabService.collect(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

export function useGitlabExportMutation() {
  return useMutation({
    mutationFn: (body: GitlabExportBody) => gitlabService.exportPreview(body),
  });
}

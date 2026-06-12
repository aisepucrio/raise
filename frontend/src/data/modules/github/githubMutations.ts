import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { githubService } from "./githubService";
import type { GithubCollectBody, GithubExportBody } from "./githubTypes";

// Starts GitHub collection and updates the global jobs list.
export function useGithubCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: GithubCollectBody) => githubService.collect(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Exports GitHub preview data.
export function useGithubExportMutation() {
  return useMutation({
    mutationFn: (body: GithubExportBody) => githubService.exportPreview(body),
  });
}

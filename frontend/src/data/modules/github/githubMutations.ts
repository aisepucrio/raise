import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { githubService } from "./githubService";
import type { GithubCollectBody, GithubExportBody } from "./githubTypes";

// starts the collection of GitHub and updates the list global of jobs.
export function useGithubCollectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: GithubCollectBody) => githubService.collect(body),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Exporta date of preview of the GitHub in the current standard format (json).
export function useGithubExportMutation() {
  return useMutation({
    mutationFn: (body: GithubExportBody) => githubService.exportPreview(body),
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { jobsService } from "./jobsService";

// for/cancela the job specific and updates the listing of jobs.
export function useStopJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => jobsService.stop(taskId),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Reinicia the collection the partir of the job and updates the listing of jobs.
export function useRestartCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => jobsService.restartCollection(taskId),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

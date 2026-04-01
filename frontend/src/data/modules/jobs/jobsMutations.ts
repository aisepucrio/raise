import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { jobsService } from "./jobsService";

// Stops/cancels a specific job and updates the jobs list.
export function useStopJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => jobsService.stop(taskId),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Restarts collection from a job and updates the jobs list.
export function useRestartCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => jobsService.restartCollection(taskId),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

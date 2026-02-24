import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateJobsQueries } from "../../query/invalidation";
import { jobsService } from "./jobsService";

// Para/cancela um job específico e atualiza a listagem de jobs.
export function useStopJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => jobsService.stop(taskId),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

// Reinicia uma coleta a partir de um job e atualiza a listagem de jobs.
export function useRestartCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => jobsService.restartCollection(taskId),
    onSuccess: () => invalidateJobsQueries(queryClient),
  });
}

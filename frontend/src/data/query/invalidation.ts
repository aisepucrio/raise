import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";

// reloads the module of jobs after actions that start/stop collections.
export function invalidateJobsQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
}

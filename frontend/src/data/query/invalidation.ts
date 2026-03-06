import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";

// Reloads jobs queries after actions that start/stop collections.
export function invalidateJobsQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
}

import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";

// Recarrega o módulo de jobs após ações que iniciam/paralisam coletas.
export function invalidateJobsQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
}

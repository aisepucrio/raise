import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";

// Reloads collection queries after actions that start/cancel collections.
export function invalidateCollectionQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
}

// Reloads mined data after a collection settles, so dashboards and previews
// show what it mined.
export function invalidateMinedDataQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.datasets.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.repositories.all }),
  ]);
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  invalidateCollectionQueries,
  invalidateMinedDataQueries,
} from "../../query/invalidation";
import { queryKeys } from "../../query/keys";
import { collectionService } from "./collectionService";
import type { StartCollectionBody } from "./collectionTypes";

// Lists collections, polling while any is running. When one settles, the
// mined-data caches are invalidated so dashboards and previews refresh.
export function useCollectionsQuery() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.collections.list(),
    queryFn: ({ signal }) => collectionService.list({ signal }),
    refetchInterval: (q) =>
      q.state.data?.some((c) => c.status === "running") ? 5000 : false,
  });

  const runningIds = useRef<Set<number> | null>(null);
  useEffect(() => {
    if (!query.data) return;
    const running = new Set(
      query.data.filter((c) => c.status === "running").map((c) => c.id),
    );
    const previous = runningIds.current;
    if (previous && [...previous].some((id) => !running.has(id))) {
      void invalidateMinedDataQueries(queryClient);
    }
    runningIds.current = running;
  }, [query.data, queryClient]);

  return query;
}

// A collection's failed job attempts, polled while it runs.
export function useCollectionErrorsQuery(
  id: number | null,
  options?: { isRunning?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.collections.errors(id ?? 0),
    enabled: id !== null,
    queryFn: ({ signal }) => collectionService.listErrors(id ?? 0, { signal }),
    refetchInterval: options?.isRunning ? 5000 : false,
  });
}

export function useStartCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StartCollectionBody) => collectionService.start(body),
    onSuccess: () => {
      void invalidateCollectionQueries(queryClient);
      // A collection can register repositories.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.repositories.all,
      });
    },
  });
}

export function useCancelCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => collectionService.cancel(id),
    onSuccess: () => invalidateCollectionQueries(queryClient),
  });
}

export function useRepositoriesQuery() {
  return useQuery({
    queryKey: queryKeys.repositories.all,
    queryFn: ({ signal }) => collectionService.listRepositories({ signal }),
  });
}

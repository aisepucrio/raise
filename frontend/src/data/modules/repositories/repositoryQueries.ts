import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlatformId } from "../../api/endpoints";
import { invalidateMinedDataQueries } from "../../query/invalidation";
import { queryKeys } from "../../query/keys";
import type { HookQueryOptions } from "../shared";
import { repositoryService } from "./repositoryService";

export function useRepositoryDataQuery(id: number | null, options?: HookQueryOptions) {
  return useQuery({
    queryKey: queryKeys.repositories.data(id ?? 0),
    enabled: id !== null && (options?.enabled ?? true),
    queryFn: ({ signal }) => repositoryService.getData(id ?? 0, { signal }),
  });
}

// Removing data changes every dashboard, preview and repository list.
export function useRemoveRepositoryDataMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, platform, key }: { id: number; platform: PlatformId; key: string }) =>
      repositoryService.removePart(id, platform, key),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(queryKeys.repositories.data(id), data);
      return invalidateMinedDataQueries(queryClient);
    },
  });
}

export function useDeleteRepositoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => repositoryService.remove(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.repositories.data(id) });
      return invalidateMinedDataQueries(queryClient);
    },
  });
}

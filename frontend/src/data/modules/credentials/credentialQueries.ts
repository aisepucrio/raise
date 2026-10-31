import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../query/keys";
import type { HookQueryOptions } from "../shared";
import { credentialService } from "./credentialService";
import type { AddCredentialBody } from "./credentialTypes";

// Platform capabilities change only with the backend, so they're cached long.
export function usePlatformsQuery() {
  return useQuery({
    queryKey: queryKeys.platforms.all,
    queryFn: ({ signal }) => credentialService.listPlatforms({ signal }),
    staleTime: 60 * 60_000,
  });
}

export function useCredentialsQuery(options?: HookQueryOptions) {
  return useQuery({
    queryKey: queryKeys.credentials.all,
    enabled: options?.enabled,
    queryFn: ({ signal }) => credentialService.list({ signal }),
  });
}

function useCredentialMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.credentials.all }),
  });
}

export function useAddCredentialMutation() {
  return useCredentialMutation((body: AddCredentialBody) =>
    credentialService.add(body),
  );
}

export function useTestCredentialMutation() {
  return useCredentialMutation((id: number) => credentialService.test(id));
}

export function useDeleteCredentialMutation() {
  return useCredentialMutation((id: number) => credentialService.remove(id));
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../query/keys";
import type { HookQueryOptions } from "../shared";
import { authService } from "./authService";
import type {
  ChangePasswordBody,
  CreateUserBody,
  LoginBody,
} from "./authTypes";

// Current session's user. A 401 is an answer (logged out), not a failure, so
// it isn't retried.
export function useMeQuery() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: ({ signal }) => authService.me({ signal }),
    retry: (failureCount, error) =>
      (error as { status?: number })?.status !== 401 && failureCount < 1,
    staleTime: 5 * 60_000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: LoginBody) => authService.login(body),
    onSuccess: (user) => {
      // A new session may see different data: start from an empty cache.
      queryClient.clear();
      queryClient.setQueryData(queryKeys.auth.me(), user);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => queryClient.clear(),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (body: ChangePasswordBody) => authService.changePassword(body),
  });
}

// Admin only.
export function useUsersQuery(options?: HookQueryOptions) {
  return useQuery({
    queryKey: queryKeys.users.all,
    enabled: options?.enabled,
    queryFn: ({ signal }) => authService.listUsers({ signal }),
  });
}

// Admin only.
export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateUserBody) => authService.createUser(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

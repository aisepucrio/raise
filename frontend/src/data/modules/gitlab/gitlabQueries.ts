import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { GitlabSection } from "../../api/endpoints";
import { queryKeys } from "../../query/keys";
import { toDateBounds, type HookQueryOptions } from "../shared";
import { gitlabService } from "./gitlabService";
import type {
  GitlabDateRangeParams,
  GitlabGraphParams,
  GitlabOverviewParams,
  GitlabPreviewParams,
} from "./gitlabTypes";

export function useGitlabOverviewQuery(
  params?: GitlabOverviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.gitlab.overview(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => gitlabService.getOverview(params, { signal }),
  });
}

export function useGitlabDateRangeQuery(
  params?: GitlabDateRangeParams,
  options?: HookQueryOptions,
) {
  const isEnabled =
    (options?.enabled ?? true) && Boolean(params?.repository_id);

  return useQuery({
    queryKey: queryKeys.gitlab.dateRange(params),
    enabled: isEnabled,
    queryFn: ({ signal }) => {
      if (!params) {
        throw new Error("repository_id is required to fetch GitLab date range.");
      }

      return gitlabService.getDateRange(params, { signal });
    },
    select: toDateBounds,
  });
}

export function useGitlabDateRangeByRepositoryQuery(
  repositoryId?: string,
  options?: HookQueryOptions,
) {
  const trimmedRepositoryId = repositoryId?.trim();

  return useGitlabDateRangeQuery(
    trimmedRepositoryId ? { repository_id: trimmedRepositoryId } : undefined,
    options,
  );
}

export function useGitlabGraphQuery(
  params: GitlabGraphParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.gitlab.graph(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => gitlabService.getGraph(params, { signal }),
  });
}

export function useGitlabPreviewQuery(
  section: GitlabSection,
  params: GitlabPreviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.gitlab.preview(section, params),
    enabled: options?.enabled,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => gitlabService.getPreview(section, params, { signal }),
  });
}

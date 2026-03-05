import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { GithubSection } from "../../api/endpoints";
import { queryKeys } from "../../query/keys";
import { githubService } from "./githubService";
import { toDateBounds } from "../shared";
import type { HookQueryOptions } from "../shared";
import type {
  GithubDateRangeParams,
  GithubGraphParams,
  GithubOverviewParams,
  GithubPreviewParams,
} from "./githubTypes";

// the hooks receive the same params of the service (without layer extra of adaptstion).
// search the cards of the dashboard of the GitHub.
export function useGithubOverviewQuery(
  params?: GithubOverviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.github.overview(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => githubService.getOverview(params, { signal }),
  });
}

// search the range minimum/maximum of dates for the repository selected.
export function useGithubDateRangeQuery(
  params?: GithubDateRangeParams,
  options?: HookQueryOptions,
) {
  const isEnabled =
    (options?.enabled ?? true) && Boolean(params?.repository_id);

  return useQuery({
    queryKey: queryKeys.github.dateRange(params),
    enabled: isEnabled,
    queryFn: ({ signal }) => {
      if (!params) {
        throw new Error(
          "repository_id is required to fetch GitHub date range.",
        );
      }
      return githubService.getDateRange(params, { signal });
    },
    select: toDateBounds,
  });
}

// convenience for components that only have `repositoryId`.
export function useGithubDateRangeByRepositoryQuery(
  repositoryId?: string,
  options?: HookQueryOptions,
) {
  const trimmedRepositoryId = repositoryId?.trim();

  return useGithubDateRangeQuery(
    trimmedRepositoryId ? { repository_id: trimmedRepositoryId } : undefined,
    options,
  );
}

// search the series temporal of the dashboard of the GitHub.
export function useGithubGraphQuery(
  params: GithubGraphParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.github.graph(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => githubService.getGraph(params, { signal }),
  });
}

// search the table paginada of preview of the section of the GitHub.
export function useGithubPreviewQuery(
  section: GithubSection,
  params: GithubPreviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.github.preview(section, params),
    enabled: options?.enabled,
    // keeps the table atual durante changes of filter/sorting/page.
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      githubService.getPreview(section, params, { signal }),
  });
}

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

// Hooks receive the same params as the service layer (no extra adaptation).
// Fetches GitHub dashboard cards.
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

// Fetches min/max date range for the selected repository.
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

// Convenience wrapper for components that only have `repositoryId`.
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

// Fetches GitHub dashboard time series.
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

// Fetches paginated preview table data for a GitHub section.
export function useGithubPreviewQuery(
  section: GithubSection,
  params: GithubPreviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.github.preview(section, params),
    enabled: options?.enabled,
    // Keeps current table data while filter/sort/page changes.
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      githubService.getPreview(section, params, { signal }),
  });
}

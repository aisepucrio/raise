import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { JiraSection } from "../../api/endpoints";
import { queryKeys } from "../../query/keys";
import { jiraService } from "./jiraService";
import { toDateBounds } from "../shared";
import type { HookQueryOptions } from "../shared";
import type {
  JiraDateRangeParams,
  JiraGraphParams,
  JiraOverviewParams,
  JiraPreviewParams,
} from "./jiraTypes";

// the hooks receive the same params of the service (without layer extra of adaptstion).
// search the cards of the dashboard of the Jira.
export function useJiraOverviewQuery(
  params?: JiraOverviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.jira.overview(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => jiraService.getOverview(params, { signal }),
  });
}

// search the range minimum/maximum of dates for the project selected.
export function useJiraDateRangeQuery(
  params?: JiraDateRangeParams,
  options?: HookQueryOptions,
) {
  const isEnabled = (options?.enabled ?? true) && Boolean(params?.project_id);

  return useQuery({
    queryKey: queryKeys.jira.dateRange(params),
    enabled: isEnabled,
    queryFn: ({ signal }) => {
      if (!params) {
        throw new Error("project_id is required to fetch Jira date range.");
      }
      return jiraService.getDateRange(params, { signal });
    },
    select: toDateBounds,
  });
}

// convenience for components that only have `projectId`.
export function useJiraDateRangeByProjectQuery(
  projectId?: string,
  options?: HookQueryOptions,
) {
  const trimmedProjectId = projectId?.trim();

  return useJiraDateRangeQuery(
    trimmedProjectId ? { project_id: trimmedProjectId } : undefined,
    options,
  );
}

// search the series temporal of the dashboard of the Jira.
export function useJiraGraphQuery(
  params: JiraGraphParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.jira.graph(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => jiraService.getGraph(params, { signal }),
  });
}

// search the table paginada of preview of the section of the Jira.
export function useJiraPreviewQuery(
  section: JiraSection,
  params: JiraPreviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.jira.preview(section, params),
    enabled: options?.enabled,
    // keeps the table atual durante changes of filter/sorting/page.
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => jiraService.getPreview(section, params, { signal }),
  });
}

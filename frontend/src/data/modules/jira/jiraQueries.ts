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

// Hooks receive the same params as the service layer (no extra adaptation).
// Fetches Jira dashboard cards.
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

// Fetches min/max date range for the selected project.
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

// Convenience wrapper for components that only have `projectId`.
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

// Fetches Jira dashboard time series.
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

// Fetches paginated preview table data for a Jira section.
export function useJiraPreviewQuery(
  section: JiraSection,
  params: JiraPreviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.jira.preview(section, params),
    enabled: options?.enabled,
    // Keeps current table data while filter/sort/page changes.
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => jiraService.getPreview(section, params, { signal }),
  });
}

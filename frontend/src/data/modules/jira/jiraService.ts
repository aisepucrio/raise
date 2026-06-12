import { ExportFormat } from "@/components/preview/PreviewExportModal";
import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { JiraSection } from "../../api/endpoints";
import {
  type ApiDateRangeResponse,
  type DashboardGraphParams,
  type DashboardGraphResponse,
  type DashboardOverviewResponse,
  type RequestOptions,
} from "../shared";
import type {
  JiraCollectBody,
  JiraDateRangeParams,
  JiraExportBody,
  JiraGraphParams,
  JiraOverviewParams,
  JiraPreviewParams,
  JiraPreviewResponse,
} from "./jiraTypes";

const SOURCE = "jira" as const;

export const jiraService = {
  // Overview and ItemSwitcher: cards of the dashboard and list of projects.
  getOverview: (
    params?: JiraOverviewParams,
    options?: RequestOptions,
  ): Promise<DashboardOverviewResponse> =>
    api.get<DashboardOverviewResponse>(endpoints.dashboard(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<DashboardOverviewResponse>,

  // Overview and Preview: date range used to limit project filters.
  getDateRange: (
    params: JiraDateRangeParams,
    options?: RequestOptions,
  ): Promise<ApiDateRangeResponse> =>
    api.get<ApiDateRangeResponse>(endpoints.dateRange(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<ApiDateRangeResponse>,

  // ChartLine (Overview): series cumulative for interval.
  getGraph: (
    params: DashboardGraphParams<{ project_id?: string }>,
    options?: RequestOptions,
  ): Promise<DashboardGraphResponse> =>
    api.get<DashboardGraphResponse>(endpoints.dashboardGraph(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<DashboardGraphResponse>,

  // Preview: paginated table for section with filters and sorting.
  getPreview: (
    section: JiraSection,
    params: JiraPreviewParams,
    options?: RequestOptions,
  ): Promise<JiraPreviewResponse> =>
    api.get<JiraPreviewResponse>(endpoints.previewList(SOURCE, section), {
      params,
      signal: options?.signal,
    }) as Promise<JiraPreviewResponse>,

  // Preview export: exports in the current standard format (json).
  exportPreview: (options?: RequestOptions) =>
    api.post(
      endpoints.export(SOURCE),
      { format: "json" },
      {
        responseType: "blob",
        signal: options?.signal,
      },
    ),

  // Collect: starts Jira collection via standardized endpoint.
  collect: (body: JiraCollectBody, options?: RequestOptions) =>
    api.post(endpoints.collect(SOURCE), body, { signal: options?.signal }),
};

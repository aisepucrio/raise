import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { JiraSection } from "../../api/endpoints";
import {
  type ApiDateRangeResponse,
  type RequestOptions,
} from "../shared";
import type {
  JiraCollectBody,
  JiraDateRangeParams,
  JiraGraphParams,
  JiraOverviewParams,
  JiraOverviewResponse,
  JiraPreviewParams,
  JiraPreviewResponse,
} from "./jiraTypes";

const SOURCE = "jira" as const;

export const jiraService = {
  // Overview and ItemSwitcher: cards of the dashboard and list of projects.
  getOverview: (
    params?: JiraOverviewParams,
    options?: RequestOptions,
  ): Promise<JiraOverviewResponse> =>
    api.get<JiraOverviewResponse>(endpoints.dashboard(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<JiraOverviewResponse>,

  // Overview and Preview: range of dates for limitar filters for project.
  getDateRange: (
    params: JiraDateRangeParams,
    options?: RequestOptions,
  ): Promise<ApiDateRangeResponse> =>
    api.get<ApiDateRangeResponse>(endpoints.dateRange(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<ApiDateRangeResponse>,

  // ChartLine (Overview): series cumulative for interval.
  getGraph: (params: JiraGraphParams, options?: RequestOptions) =>
    api.get(endpoints.dashboardGraph(SOURCE), { params, signal: options?.signal }),

  // Preview: table paginada for section with filters and sorting.
  getPreview: (
    section: JiraSection,
    params: JiraPreviewParams,
    options?: RequestOptions,
  ): Promise<JiraPreviewResponse> =>
    api.get<JiraPreviewResponse>(endpoints.previewList(SOURCE, section), {
      params,
      signal: options?.signal,
    }) as Promise<JiraPreviewResponse>,

  // ModalDownload (Preview): exporta in the current standard format (json).
  exportPreview: (options?: RequestOptions) =>
    api.post(endpoints.export(SOURCE), { format: "json" }, {
      responseType: "blob",
      signal: options?.signal,
    }),

  // Collect: starts the collection of Jira via endpoint standardized.
  collect: (body: JiraCollectBody, options?: RequestOptions) =>
    api.post(endpoints.collect(SOURCE), body, { signal: options?.signal }),
};

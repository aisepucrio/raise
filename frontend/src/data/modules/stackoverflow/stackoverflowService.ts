import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { StackOverflowSection } from "../../api/endpoints";
import {
  type ApiDateRangeResponse,
  type DashboardGraphParams,
  type DashboardGraphResponse,
  type DashboardOverviewResponse,
  type RequestOptions,
} from "../shared";
import type {
  StackOverflowCollectBody,
  StackOverflowDateRangeParams,
  StackOverflowOverviewParams,
  StackOverflowPreviewParams,
  StackOverflowPreviewResponse,
} from "./stackoverflowTypes";

const SOURCE = "stackoverflow" as const;

export const stackoverflowService = {
  // Overview and ItemSwitcher: cards of the dashboard and list of questions.
  getOverview: (
    params?: StackOverflowOverviewParams,
    options?: RequestOptions,
  ): Promise<DashboardOverviewResponse> =>
    api.get<DashboardOverviewResponse>(endpoints.legacy.dashboard(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<DashboardOverviewResponse>,

  // Overview and Preview: date range used to limit question filters.
  getDateRange: (
    params: StackOverflowDateRangeParams,
    options?: RequestOptions,
  ): Promise<ApiDateRangeResponse> =>
    api.get<ApiDateRangeResponse>(endpoints.legacy.dateRange(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<ApiDateRangeResponse>,

  // ChartLine (Overview): series cumulative for interval (without question_id).
  getGraph: (
    params: DashboardGraphParams<{ tag?: string }>,
    options?: RequestOptions,
  ): Promise<DashboardGraphResponse> =>
    api.get<DashboardGraphResponse>(endpoints.legacy.dashboardGraph(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<DashboardGraphResponse>,

  // Preview: paginated questions table with filters and sorting.
  getPreview: (
    section: StackOverflowSection,
    params: StackOverflowPreviewParams,
    options?: RequestOptions,
  ): Promise<StackOverflowPreviewResponse> =>
    api.get<StackOverflowPreviewResponse>(
      endpoints.legacy.previewList(SOURCE, section),
      {
        params,
        signal: options?.signal,
      },
    ) as Promise<StackOverflowPreviewResponse>,

  // Preview export: exports in the current standard format (json).
  exportPreview: (options?: RequestOptions) =>
    api.post(
      endpoints.legacy.export(SOURCE),
      { format: "json" },
      {
        responseType: "blob",
        signal: options?.signal,
      },
    ),

  // Collect: starts Stack Overflow collection via standardized endpoint.
  collect: (body: StackOverflowCollectBody, options?: RequestOptions) =>
    api.post(endpoints.legacy.collect(SOURCE), body, { signal: options?.signal }),
};

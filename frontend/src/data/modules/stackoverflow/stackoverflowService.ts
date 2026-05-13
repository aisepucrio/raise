import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { StackOverflowSection } from "../../api/endpoints";
import {
  type ApiDateRangeResponse,
  type RequestOptions,
} from "../shared";
import type {
  StackOverflowAdvancedCollectBody,
  StackOverflowCollectBody,
  StackOverflowDateRangeParams,
  StackOverflowGraphParams,
  StackOverflowOverviewParams,
  StackOverflowOverviewResponse,
  StackOverflowPreviewParams,
  StackOverflowPreviewResponse,
} from "./stackoverflowTypes";

const SOURCE = "stackoverflow" as const;

export const stackoverflowService = {
  // Overview and ItemSwitcher: cards of the dashboard and list of questions.
  getOverview: (
    params?: StackOverflowOverviewParams,
    options?: RequestOptions,
  ): Promise<StackOverflowOverviewResponse> =>
    api.get<StackOverflowOverviewResponse>(endpoints.dashboard(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<StackOverflowOverviewResponse>,

  // Overview and Preview: date range used to limit question filters.
  getDateRange: (
    params: StackOverflowDateRangeParams,
    options?: RequestOptions,
  ): Promise<ApiDateRangeResponse> =>
    api.get<ApiDateRangeResponse>(endpoints.dateRange(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<ApiDateRangeResponse>,

  // ChartLine (Overview): series cumulative for interval (without question_id).
  getGraph: (params: StackOverflowGraphParams, options?: RequestOptions) =>
    api.get(endpoints.dashboardGraph(SOURCE), {
      params,
      signal: options?.signal,
    }),

  // Preview: paginated questions table with filters and sorting.
  getPreview: (
    section: StackOverflowSection,
    params: StackOverflowPreviewParams,
    options?: RequestOptions,
  ): Promise<StackOverflowPreviewResponse> =>
    api.get<StackOverflowPreviewResponse>(endpoints.previewList(SOURCE, section), {
      params,
      signal: options?.signal,
    }) as Promise<StackOverflowPreviewResponse>,

  // Preview export: exports in the current standard format (json).
  exportPreview: (options?: RequestOptions) =>
    api.post(endpoints.export(SOURCE), { format: "json" }, {
      responseType: "blob",
      signal: options?.signal,
    }),

  // Collect: starts Stack Overflow collection via standardized endpoint.
  collect: (body: StackOverflowCollectBody, options?: RequestOptions) =>
    api.post(endpoints.collect(SOURCE), body, { signal: options?.signal }),

  // TEMPORARY HARDCODE: SO still uses /COLLECT/ADVANCED for legacy compatibility.
  // FUTURE: merge into /COLLECT using payload only.
  collectAdvanced: (
    body: StackOverflowAdvancedCollectBody,
    options?: RequestOptions,
  ) =>
    api.post(endpoints.collectAdvanced(SOURCE), body, {
      signal: options?.signal,
    }),
};

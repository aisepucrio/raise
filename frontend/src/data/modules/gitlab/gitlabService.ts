import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { GitlabSection } from "../../api/endpoints";
import { type ApiDateRangeResponse, type RequestOptions } from "../shared";
import type {
  GitlabCollectBody,
  GitlabDateRangeParams,
  GitlabExportBody,
  GitlabGraphParams,
  GitlabGraphResponse,
  GitlabOverviewParams,
  GitlabOverviewResponse,
  GitlabPreviewParams,
  GitlabPreviewResponse,
} from "./gitlabTypes";

const SOURCE = "gitlab" as const;

export const gitlabService = {
  getOverview: (
    params?: GitlabOverviewParams,
    options?: RequestOptions,
  ): Promise<GitlabOverviewResponse> =>
    api.get<GitlabOverviewResponse>(endpoints.dashboard(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<GitlabOverviewResponse>,

  getDateRange: (
    params: GitlabDateRangeParams,
    options?: RequestOptions,
  ): Promise<ApiDateRangeResponse> =>
    api.get<ApiDateRangeResponse>(endpoints.dateRange(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<ApiDateRangeResponse>,

  getGraph: (
    params: GitlabGraphParams,
    options?: RequestOptions,
  ): Promise<GitlabGraphResponse> =>
    api.get<GitlabGraphResponse>(endpoints.dashboardGraph(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<GitlabGraphResponse>,

  getPreview: (
    section: GitlabSection,
    params: GitlabPreviewParams,
    options?: RequestOptions,
  ): Promise<GitlabPreviewResponse> =>
    api.get<GitlabPreviewResponse>(endpoints.previewList(SOURCE, section), {
      params,
      signal: options?.signal,
    }) as Promise<GitlabPreviewResponse>,

  exportPreview: (body: GitlabExportBody, options?: RequestOptions) =>
    api.post(endpoints.export(SOURCE), body, {
      responseType: "blob",
      signal: options?.signal,
    }),

  collect: (body: GitlabCollectBody, options?: RequestOptions) =>
    api.post(endpoints.collect(SOURCE), body, { signal: options?.signal }),
};

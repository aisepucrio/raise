import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { GithubSection } from "../../api/endpoints";
import {
  type ApiDateRangeResponse,
  type RequestOptions,
} from "../shared";
import type {
  GithubCollectBody,
  GithubDateRangeParams,
  GithubExportBody,
  GithubGraphParams,
  GithubGraphResponse,
  GithubOverviewParams,
  GithubOverviewResponse,
  GithubPreviewParams,
  GithubPreviewResponse,
} from "./githubTypes";

const SOURCE = "github" as const;

export const githubService = {
  // Overview and ItemSwitcher: cards of the dashboard and list of repositories.
  getOverview: (
    params?: GithubOverviewParams,
    options?: RequestOptions,
  ): Promise<GithubOverviewResponse> =>
    api.get<GithubOverviewResponse>(endpoints.dashboard(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<GithubOverviewResponse>,

  // Overview and Preview: range of dates for limitar filters for repository.
  getDateRange: (
    params: GithubDateRangeParams,
    options?: RequestOptions,
  ): Promise<ApiDateRangeResponse> =>
    api.get<ApiDateRangeResponse>(endpoints.dateRange(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<ApiDateRangeResponse>,

  // ChartLine (Overview): series cumulative for interval.
  getGraph: (
    params: GithubGraphParams,
    options?: RequestOptions,
  ): Promise<GithubGraphResponse> =>
    api.get<GithubGraphResponse>(endpoints.dashboardGraph(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<GithubGraphResponse>,

  // Preview: table paginada for section with filters and sorting.
  getPreview: (
    section: GithubSection,
    params: GithubPreviewParams,
    options?: RequestOptions,
  ): Promise<GithubPreviewResponse> =>
    api.get<GithubPreviewResponse>(endpoints.previewList(SOURCE, section), {
      params,
      signal: options?.signal,
    }) as Promise<GithubPreviewResponse>,

  // ModalDownload (Preview): exporta in the current standard format (json).
  exportPreview: (body: GithubExportBody, options?: RequestOptions) =>
    api.post(endpoints.export(SOURCE), body, {
      responseType: "blob",
      signal: options?.signal,
    }),

  // Collect: starts the collection of GitHub via endpoint standardized.
  collect: (body: GithubCollectBody, options?: RequestOptions) =>
    api.post(endpoints.collect(SOURCE), body, { signal: options?.signal }),
};

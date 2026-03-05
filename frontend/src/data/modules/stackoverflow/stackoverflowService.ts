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

  // Overview and Preview: range of dates for limitar filters for question.
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

  // Preview: table paginada of questions with filters and sorting.
  getPreview: (
    section: StackOverflowSection,
    params: StackOverflowPreviewParams,
    options?: RequestOptions,
  ): Promise<StackOverflowPreviewResponse> =>
    api.get<StackOverflowPreviewResponse>(endpoints.previewList(SOURCE, section), {
      params,
      signal: options?.signal,
    }) as Promise<StackOverflowPreviewResponse>,

  // ModalDownload (Preview): exporta in the current standard format (json).
  exportPreview: (options?: RequestOptions) =>
    api.post(endpoints.export(SOURCE), { format: "json" }, {
      responseType: "blob",
      signal: options?.signal,
    }),

  // Collect: starts the collection of Stack Overflow via endpoint standardized.
  collect: (body: StackOverflowCollectBody, options?: RequestOptions) =>
    api.post(endpoints.collect(SOURCE), body, { signal: options?.signal }),

  // HARDCODE TEMPORARIO: the SO AINDA USA /COLLECT/ADVANCED for COMPATIBILIDADE with the IMPLEMENTACAO LEGADA.
  // FUTURO: MERGEAR with /COLLECT USANDO only PAYLOAD.
  collectAdvanced: (
    body: StackOverflowAdvancedCollectBody,
    options?: RequestOptions,
  ) =>
    api.post(endpoints.collectAdvanced(SOURCE), body, {
      signal: options?.signal,
    }),
};

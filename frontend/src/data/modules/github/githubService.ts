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
  // Overview e ItemSwitcher: cards do dashboard e lista de repositorios.
  getOverview: (
    params?: GithubOverviewParams,
    options?: RequestOptions,
  ): Promise<GithubOverviewResponse> =>
    api.get<GithubOverviewResponse>(endpoints.dashboard(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<GithubOverviewResponse>,

  // Overview e Preview: faixa de datas para limitar filtros por repositorio.
  getDateRange: (
    params: GithubDateRangeParams,
    options?: RequestOptions,
  ): Promise<ApiDateRangeResponse> =>
    api.get<ApiDateRangeResponse>(endpoints.dateRange(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<ApiDateRangeResponse>,

  // ChartLine (Overview): serie acumulada por intervalo.
  getGraph: (
    params: GithubGraphParams,
    options?: RequestOptions,
  ): Promise<GithubGraphResponse> =>
    api.get<GithubGraphResponse>(endpoints.dashboardGraph(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<GithubGraphResponse>,

  // Preview: tabela paginada por secao com filtros e ordenacao.
  getPreview: (
    section: GithubSection,
    params: GithubPreviewParams,
    options?: RequestOptions,
  ): Promise<GithubPreviewResponse> =>
    api.get<GithubPreviewResponse>(endpoints.previewList(SOURCE, section), {
      params,
      signal: options?.signal,
    }) as Promise<GithubPreviewResponse>,

  // ModalDownload (Preview): exporta no formato padrão atual (json).
  exportPreview: (body: GithubExportBody, options?: RequestOptions) =>
    api.post(endpoints.export(SOURCE), body, {
      responseType: "blob",
      signal: options?.signal,
    }),

  // Collect: inicia a coleta de GitHub via endpoint padronizado.
  collect: (body: GithubCollectBody, options?: RequestOptions) =>
    api.post(endpoints.collect(SOURCE), body, { signal: options?.signal }),
};

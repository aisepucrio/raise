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
  // Overview e ItemSwitcher: cards do dashboard e lista de projetos.
  getOverview: (
    params?: JiraOverviewParams,
    options?: RequestOptions,
  ): Promise<JiraOverviewResponse> =>
    api.get<JiraOverviewResponse>(endpoints.dashboard(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<JiraOverviewResponse>,

  // Overview e Preview: faixa de datas para limitar filtros por projeto.
  getDateRange: (
    params: JiraDateRangeParams,
    options?: RequestOptions,
  ): Promise<ApiDateRangeResponse> =>
    api.get<ApiDateRangeResponse>(endpoints.dateRange(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<ApiDateRangeResponse>,

  // ChartLine (Overview): serie acumulada por intervalo.
  getGraph: (params: JiraGraphParams, options?: RequestOptions) =>
    api.get(endpoints.dashboardGraph(SOURCE), { params, signal: options?.signal }),

  // Preview: tabela paginada por secao com filtros e ordenacao.
  getPreview: (
    section: JiraSection,
    params: JiraPreviewParams,
    options?: RequestOptions,
  ): Promise<JiraPreviewResponse> =>
    api.get<JiraPreviewResponse>(endpoints.previewList(SOURCE, section), {
      params,
      signal: options?.signal,
    }) as Promise<JiraPreviewResponse>,

  // ModalDownload (Preview): exporta no formato padrão atual (json).
  exportPreview: (options?: RequestOptions) =>
    api.post(endpoints.export(SOURCE), { format: "json" }, {
      responseType: "blob",
      signal: options?.signal,
    }),

  // Collect: inicia a coleta de Jira via endpoint padronizado.
  collect: (body: JiraCollectBody, options?: RequestOptions) =>
    api.post(endpoints.collect(SOURCE), body, { signal: options?.signal }),
};

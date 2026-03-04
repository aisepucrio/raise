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
  // Overview e ItemSwitcher: cards do dashboard e lista de perguntas.
  getOverview: (
    params?: StackOverflowOverviewParams,
    options?: RequestOptions,
  ): Promise<StackOverflowOverviewResponse> =>
    api.get<StackOverflowOverviewResponse>(endpoints.dashboard(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<StackOverflowOverviewResponse>,

  // Overview e Preview: faixa de datas para limitar filtros por pergunta.
  getDateRange: (
    params: StackOverflowDateRangeParams,
    options?: RequestOptions,
  ): Promise<ApiDateRangeResponse> =>
    api.get<ApiDateRangeResponse>(endpoints.dateRange(SOURCE), {
      params,
      signal: options?.signal,
    }) as Promise<ApiDateRangeResponse>,

  // ChartLine (Overview): serie acumulada por intervalo (sem question_id).
  getGraph: (params: StackOverflowGraphParams, options?: RequestOptions) =>
    api.get(endpoints.dashboardGraph(SOURCE), {
      params,
      signal: options?.signal,
    }),

  // Preview: tabela paginada de questions com filtros e ordenacao.
  getPreview: (
    section: StackOverflowSection,
    params: StackOverflowPreviewParams,
    options?: RequestOptions,
  ): Promise<StackOverflowPreviewResponse> =>
    api.get<StackOverflowPreviewResponse>(endpoints.previewList(SOURCE, section), {
      params,
      signal: options?.signal,
    }) as Promise<StackOverflowPreviewResponse>,

  // ModalDownload (Preview): exporta no formato padrão atual (json).
  exportPreview: (options?: RequestOptions) =>
    api.post(endpoints.export(SOURCE), { format: "json" }, {
      responseType: "blob",
      signal: options?.signal,
    }),

  // Collect: inicia a coleta de Stack Overflow via endpoint padronizado.
  collect: (body: StackOverflowCollectBody, options?: RequestOptions) =>
    api.post(endpoints.collect(SOURCE), body, { signal: options?.signal }),

  // HARDCODE TEMPORARIO: O SO AINDA USA /COLLECT/ADVANCED POR COMPATIBILIDADE COM A IMPLEMENTACAO LEGADA.
  // FUTURO: MERGEAR COM /COLLECT USANDO APENAS PAYLOAD.
  collectAdvanced: (
    body: StackOverflowAdvancedCollectBody,
    options?: RequestOptions,
  ) =>
    api.post(endpoints.collectAdvanced(SOURCE), body, {
      signal: options?.signal,
    }),
};

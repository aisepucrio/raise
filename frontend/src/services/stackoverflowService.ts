import { api } from "../api/apiClient";
import { endpoints } from "../api/endpoints";
import type { StackOverflowSection } from "../api/endpoints";
import {
  getDateInputBounds,
  type ApiDateRangeResponse,
  type DateFilterRange,
  type RequestOptions,
} from "./shared";

const SOURCE = "stackoverflow" as const;

export type StackOverflowPreviewParams = {
  page: number;
  page_size: number;
  question_id?: string;
  search?: string;
  ordering?: string;
  creation_date__gte?: string;
  creation_date__lte?: string;
};

export type StackOverflowOverviewParams = DateFilterRange & { question_id?: string };
export type StackOverflowDateRangeParams = { question_id: string };
export type StackOverflowGraphParams = DateFilterRange & {
  interval: "day" | "month" | "year";
};

export type StackOverflowExportBody = {
  // No fluxo atual Stack Overflow exporta basicamente o formato.
  format: "json" | "csv" | "xlsx" | string;
};

export type StackOverflowCollectBody = {
  options: ["collect_questions"];
  start_date: string;
  end_date: string;
  tags?: string;
};

export const stackoverflowService = {
  // Overview e ItemSwitcher: cards do dashboard e lista de perguntas.
  getOverview: (params?: StackOverflowOverviewParams, options?: RequestOptions) =>
    api.get(endpoints.dashboard(SOURCE), {
      params,
      signal: options?.signal,
    }),

  // Overview e Preview: faixa de datas para limitar filtros por pergunta.
  getDateRange: (
    params: StackOverflowDateRangeParams,
    options?: RequestOptions,
  ) =>
    api.get<ApiDateRangeResponse>(endpoints.dateRange(SOURCE), {
      params,
      signal: options?.signal,
    }),

  // Overview e Preview: atalho para buscar date-range pelo item selecionado.
  getDateRangeByItem: (itemId: string, options?: RequestOptions) =>
    api.get<ApiDateRangeResponse>(endpoints.dateRange(SOURCE), {
      params: { question_id: itemId },
      signal: options?.signal,
    }),

  // Overview e Preview: normaliza min/max_date para input de data.
  toDateBounds: getDateInputBounds,

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
  ) =>
    api.get(endpoints.previewList(SOURCE, section), {
      params,
      signal: options?.signal,
    }),

  // ModalDownload (Preview): exporta dados de Stack Overflow.
  exportPreview: (body: StackOverflowExportBody, options?: RequestOptions) =>
    api.post(endpoints.export(SOURCE), body, {
      responseType: "blob",
      signal: options?.signal,
    }),

  // Collect: inicia a coleta de Stack Overflow via endpoint padronizado.
  collect: (body: StackOverflowCollectBody, options?: RequestOptions) =>
    api.post(endpoints.collect(SOURCE), body, { signal: options?.signal }),
};

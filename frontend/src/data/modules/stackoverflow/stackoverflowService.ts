import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { StackOverflowSection } from "../../api/endpoints";
import {
  type ApiDateRangeResponse,
  type DateFilterRange,
  type RequestOptions,
} from "../shared";

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

// Resposta do dashboard/overview (cards + lista de perguntas).
export type StackOverflowOverviewQuestion = {
  id?: string | number;
  question_id?: string | number;
  title?: string;
  question_title?: string;
  question?: string;
  display?: string;
};

export type StackOverflowOverviewResponse = {
  questions_count?: number;
  answers_count?: number;
  comments_count?: number;
  tags_count?: number;
  questions?: StackOverflowOverviewQuestion[];
  time_mined?: string | null;
};

export type StackOverflowOverviewParams = DateFilterRange & { question_id?: string };
export type StackOverflowDateRangeParams = { question_id: string };
export type StackOverflowGraphParams = DateFilterRange & {
  interval: "day" | "month" | "year";
};

export type StackOverflowCollectBody = {
  options: ["collect_questions"];
  start_date: string;
  end_date: string;
  tags?: string;
};

export type StackOverflowPreviewRow = Record<string, unknown>;

export type StackOverflowPreviewResponse = {
  count?: number;
  results?: StackOverflowPreviewRow[];
};

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
};

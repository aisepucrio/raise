import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { JiraSection } from "../../api/endpoints";
import {
  type ApiDateRangeResponse,
  type DateFilterRange,
  type RequestOptions,
} from "../shared";

const SOURCE = "jira" as const;

export type JiraOverviewParams = DateFilterRange & { project_id?: string };
export type JiraDateRangeParams = { project_id: string };
export type JiraGraphParams = DateFilterRange & {
  interval: "day" | "month" | "year";
  project_id?: string;
};

export type JiraPreviewParams = {
  page: number;
  page_size: number;
  // No preview do Jira o filtro usa `project` (e nao `project_id`).
  project?: string;
  search?: string;
  ordering?: string;
  // Usado em `sprints`.
  startDate__gte?: string;
  endDate__lte?: string;
  // Usado em `users`.
  updated_at__gte?: string;
  updated_at__lte?: string;
  // Usado em `issues` e `comments`.
  created__gte?: string;
  created__lte?: string;
};

export type JiraProject = { jira_domain: string; project_key: string };
export type JiraCollectBody = {
  projects: JiraProject[];
  start_date?: string;
  end_date?: string;
};

export const jiraService = {
  // Overview e ItemSwitcher: cards do dashboard e lista de projetos.
  getOverview: (params?: JiraOverviewParams, options?: RequestOptions) =>
    api.get(endpoints.dashboard(SOURCE), { params, signal: options?.signal }),

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
  ) =>
    api.get(endpoints.previewList(SOURCE, section), {
      params,
      signal: options?.signal,
    }),

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

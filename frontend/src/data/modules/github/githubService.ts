import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { GithubSection } from "../../api/endpoints";
import {
  type ApiDateRangeResponse,
  type DateFilterRange,
  type RequestOptions,
} from "../shared";

const SOURCE = "github" as const;

export type GithubOverviewParams = DateFilterRange & { repository_id?: string };
export type GithubDateRangeParams = { repository_id: string };
export type GithubGraphParams = DateFilterRange & {
  interval: "day" | "month" | "year";
  repository_id?: string;
};

// Resposta do dashboard/overview (cards + lista de repositórios)
export type GithubRepository = {
  id: number;
  repository: string;
};

export type GithubOverviewResponse = {
  issues_count?: number;
  pull_requests_count?: number;
  commits_count?: number;
  comments_count?: number;
  forks_count?: number;
  stars_count?: number;
  users_count?: number;
  repositories_count?: number;
  repositories?: GithubRepository[];
  time_mined?: string | null;
};

// Resposta do gráfico do dashboard (séries por rótulo/tempo)
export type GithubGraphResponse = {
  time_series?: {
    labels?: string[];
    [key: string]: unknown;
  };
  repository_id?: number;
  repository_name?: string;
};

export type GithubPreviewParams = {
  page: number;
  page_size: number;
  // No preview do GitHub o filtro usa `repository` (e nao `repository_id`).
  repository?: string;
  search?: string;
  ordering?: string;
  // Usado em `commits` e `users`.
  date__gte?: string;
  date__lte?: string;
  // Usado em `issues` e `pull-requests`.
  created_at__gte?: string;
  created_at__lte?: string;
};

export type GithubCollectType =
  | "metadata"
  | "issues"
  | "comments"
  | "pull_requests"
  | "commits";

export type GithubCollectBody = {
  repositories: string[];
  depth: "basic";
  collect_types: GithubCollectType[];
  start_date?: string;
  end_date?: string;
};

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
  ) =>
    api.get(endpoints.previewList(SOURCE, section), {
      params,
      signal: options?.signal,
    }),

  // ModalDownload (Preview): exporta no formato padrão atual (json).
  exportPreview: (options?: RequestOptions) =>
    api.post(
      endpoints.export(SOURCE),
      { format: "json" },
      {
        responseType: "blob",
        signal: options?.signal,
      },
    ),

  // Collect: inicia a coleta de GitHub via endpoint padronizado.
  collect: (body: GithubCollectBody, options?: RequestOptions) =>
    api.post(endpoints.collect(SOURCE), body, { signal: options?.signal }),
};

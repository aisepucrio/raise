import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { JiraSection } from "../../api/endpoints";
import { queryKeys } from "../../query/keys";
import { jiraService } from "./jiraService";
import { toDateBounds } from "../shared";
import type { HookQueryOptions } from "../shared";
import type {
  JiraDateRangeParams,
  JiraGraphParams,
  JiraOverviewParams,
  JiraPreviewParams,
} from "./jiraService";

// Os hooks recebem os mesmos params do service (sem camada extra de adaptação).
// Busca os cards do dashboard do Jira.
export function useJiraOverviewQuery(
  params?: JiraOverviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.jira.overview(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => jiraService.getOverview(params, { signal }),
  });
}

// Busca a faixa mínima/máxima de datas para o projeto selecionado.
export function useJiraDateRangeQuery(
  params?: JiraDateRangeParams,
  options?: HookQueryOptions,
) {
  const isEnabled = (options?.enabled ?? true) && Boolean(params?.project_id);

  return useQuery({
    queryKey: queryKeys.jira.dateRange(params),
    enabled: isEnabled,
    queryFn: ({ signal }) => {
      if (!params) {
        throw new Error("project_id é obrigatório para buscar date range do Jira.");
      }
      return jiraService.getDateRange(params, { signal });
    },
    select: toDateBounds,
  });
}

// Conveniência para componentes que só têm `projectId`.
export function useJiraDateRangeByProjectQuery(
  projectId?: string,
  options?: HookQueryOptions,
) {
  const trimmedProjectId = projectId?.trim();

  return useJiraDateRangeQuery(
    trimmedProjectId ? { project_id: trimmedProjectId } : undefined,
    options,
  );
}

// Busca a série temporal do dashboard do Jira.
export function useJiraGraphQuery(
  params: JiraGraphParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.jira.graph(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => jiraService.getGraph(params, { signal }),
  });
}

// Busca a tabela paginada de preview de uma seção do Jira.
export function useJiraPreviewQuery(
  section: JiraSection,
  params: JiraPreviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.jira.preview(section, params),
    enabled: options?.enabled,
    // Mantém a tabela atual durante mudanças de filtro/ordenação/página.
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => jiraService.getPreview(section, params, { signal }),
  });
}

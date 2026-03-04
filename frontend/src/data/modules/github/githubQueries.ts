import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { GithubSection } from "../../api/endpoints";
import { queryKeys } from "../../query/keys";
import { githubService } from "./githubService";
import { toDateBounds } from "../shared";
import type { HookQueryOptions } from "../shared";
import type {
  GithubDateRangeParams,
  GithubGraphParams,
  GithubOverviewParams,
  GithubPreviewParams,
} from "./githubTypes";

// Os hooks recebem os mesmos params do service (sem camada extra de adaptação).
// Busca os cards do dashboard do GitHub.
export function useGithubOverviewQuery(
  params?: GithubOverviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.github.overview(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => githubService.getOverview(params, { signal }),
  });
}

// Busca a faixa mínima/máxima de datas para o repositório selecionado.
export function useGithubDateRangeQuery(
  params?: GithubDateRangeParams,
  options?: HookQueryOptions,
) {
  const isEnabled =
    (options?.enabled ?? true) && Boolean(params?.repository_id);

  return useQuery({
    queryKey: queryKeys.github.dateRange(params),
    enabled: isEnabled,
    queryFn: ({ signal }) => {
      if (!params) {
        throw new Error(
          "repository_id é obrigatório para buscar date range do GitHub.",
        );
      }
      return githubService.getDateRange(params, { signal });
    },
    select: toDateBounds,
  });
}

// Conveniência para componentes que só têm `repositoryId`.
export function useGithubDateRangeByRepositoryQuery(
  repositoryId?: string,
  options?: HookQueryOptions,
) {
  const trimmedRepositoryId = repositoryId?.trim();

  return useGithubDateRangeQuery(
    trimmedRepositoryId ? { repository_id: trimmedRepositoryId } : undefined,
    options,
  );
}

// Busca a série temporal do dashboard do GitHub.
export function useGithubGraphQuery(
  params: GithubGraphParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.github.graph(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => githubService.getGraph(params, { signal }),
  });
}

// Busca a tabela paginada de preview de uma seção do GitHub.
export function useGithubPreviewQuery(
  section: GithubSection,
  params: GithubPreviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.github.preview(section, params),
    enabled: options?.enabled,
    // Mantém a tabela atual durante mudanças de filtro/ordenação/página.
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      githubService.getPreview(section, params, { signal }),
  });
}

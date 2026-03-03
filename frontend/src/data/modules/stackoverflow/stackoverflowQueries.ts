import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { StackOverflowSection } from "../../api/endpoints";
import { queryKeys } from "../../query/keys";
import { stackoverflowService } from "./stackoverflowService";
import { toDateBounds } from "../shared";
import type { HookQueryOptions } from "../shared";
import type {
  StackOverflowDateRangeParams,
  StackOverflowGraphParams,
  StackOverflowOverviewParams,
  StackOverflowPreviewParams,
} from "./stackoverflowService";

// Os hooks recebem os mesmos params do service (sem camada extra de adaptação).
// Busca os cards do dashboard do Stack Overflow.
export function useStackOverflowOverviewQuery(
  params?: StackOverflowOverviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.stackoverflow.overview(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => stackoverflowService.getOverview(params, { signal }),
  });
}

// Busca a faixa mínima/máxima de datas para a pergunta selecionada.
export function useStackOverflowDateRangeQuery(
  params?: StackOverflowDateRangeParams,
  options?: HookQueryOptions,
) {
  const isEnabled = (options?.enabled ?? true) && Boolean(params?.question_id);

  return useQuery({
    queryKey: queryKeys.stackoverflow.dateRange(params),
    enabled: isEnabled,
    queryFn: ({ signal }) => {
      if (!params) {
        throw new Error(
          "question_id é obrigatório para buscar date range do Stack Overflow.",
        );
      }
      return stackoverflowService.getDateRange(params, { signal });
    },
    select: toDateBounds,
  });
}

// Conveniência para componentes que só têm `questionId`.
export function useStackOverflowDateRangeByQuestionQuery(
  questionId?: string,
  options?: HookQueryOptions,
) {
  const trimmedQuestionId = questionId?.trim();

  return useStackOverflowDateRangeQuery(
    trimmedQuestionId ? { question_id: trimmedQuestionId } : undefined,
    options,
  );
}

// Busca a série temporal do dashboard do Stack Overflow.
export function useStackOverflowGraphQuery(
  params: StackOverflowGraphParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.stackoverflow.graph(params),
    enabled: options?.enabled,
    queryFn: ({ signal }) => stackoverflowService.getGraph(params, { signal }),
  });
}

// Busca a tabela paginada de preview de uma seção do Stack Overflow.
export function useStackOverflowPreviewQuery(
  section: StackOverflowSection,
  params: StackOverflowPreviewParams,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.stackoverflow.preview(section, params),
    enabled: options?.enabled,
    // Mantém a tabela atual durante mudanças de filtro/ordenação/página.
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      stackoverflowService.getPreview(section, params, { signal }),
  });
}

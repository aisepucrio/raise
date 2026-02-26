import { sourceIds, type SourceId } from "@/sources";

// Query keys são a "identidade" de cada consulta no cache do React Query.
// Elas servem para:
// - separar caches por tela/filtros/paginação
// - evitar colisão entre consultas diferentes
// - permitir invalidate/refetch por prefixo (ex.: ["jobs"])
//
// Sem isso centralizado, o código funciona, mas fica mais fácil errar
// (ex.: "date-range" vs "dateRange", "job" vs "jobs").

// Esta função é uma "fábrica":
// dado um source ("github", "jira", etc), ela devolve um objeto com as
// funções de key daquele source.
//
// Exemplo:
// createSourceQueryKeys("github").overview({ page: 1 })
// -> ["github", "overview", { page: 1 }]
function createSourceQueryKeys(source: SourceId) {
  return {
    overview: (params?: unknown) =>
      [source, "overview", params ?? null] as const,
    dateRange: (params?: unknown) =>
      [source, "date-range", params ?? null] as const,
    graph: (params?: unknown) => [source, "graph", params ?? null] as const,
    preview: (section: string, params?: unknown) =>
      [source, "preview", section, params ?? null] as const,
  };
}

// Aqui montamos um objeto que vai ficar assim:
// {
//   github: { overview, dateRange, graph, preview },
//   jira: { ... },
//   stackoverflow: { ... }
// }
const sourceQueryKeys = {} as Record<
  SourceId,
  ReturnType<typeof createSourceQueryKeys>
>;

// Para cada source definido em "@/sources", criamos automaticamente seu grupo
// de query keys. Isso evita repetir manualmente github/jira/stackoverflow.
// OBS: Para isso é considerado que há uma padronização entre as keys de cada source (overview, dateRange, graph, preview).
for (const source of sourceIds) {
  sourceQueryKeys[source] = createSourceQueryKeys(source);
}

// Objeto final usado pela aplicação:
// - traz as keys de cada source (github/jira/stackoverflow)
// - adiciona também as keys específicas de jobs
export const queryKeys = {
  ...sourceQueryKeys,
  jobs: {
    // Prefixo para invalidar tudo que pertence a jobs.
    all: ["jobs"] as const,
    // Chave da listagem principal de jobs.
    list: () => ["jobs", "list"] as const,
  },
};

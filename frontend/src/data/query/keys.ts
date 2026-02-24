// Query keys são a "identidade" de cada consulta no cache do React Query.
// Elas servem para:
// - separar caches por tela/filtros/paginação
// - evitar colisão entre consultas diferentes
// - permitir invalidate/refetch por prefixo (ex.: ["jobs"])
//
// Sem isso centralizado, o código funciona, mas fica mais fácil errar
// (ex.: "date-range" vs "dateRange", "job" vs "jobs").
export const queryKeys = {
  github: {
    overview: (params?: unknown) => ["github", "overview", params ?? null] as const,
    dateRange: (params?: unknown) =>
      ["github", "date-range", params ?? null] as const,
    graph: (params?: unknown) => ["github", "graph", params ?? null] as const,
    preview: (section: string, params?: unknown) =>
      ["github", "preview", section, params ?? null] as const,
  },
  jira: {
    overview: (params?: unknown) => ["jira", "overview", params ?? null] as const,
    dateRange: (params?: unknown) => ["jira", "date-range", params ?? null] as const,
    graph: (params?: unknown) => ["jira", "graph", params ?? null] as const,
    preview: (section: string, params?: unknown) =>
      ["jira", "preview", section, params ?? null] as const,
  },
  stackoverflow: {
    overview: (params?: unknown) =>
      ["stackoverflow", "overview", params ?? null] as const,
    dateRange: (params?: unknown) =>
      ["stackoverflow", "date-range", params ?? null] as const,
    graph: (params?: unknown) =>
      ["stackoverflow", "graph", params ?? null] as const,
    preview: (section: string, params?: unknown) =>
      ["stackoverflow", "preview", section, params ?? null] as const,
  },
  jobs: {
    // Prefixo para invalidar tudo que pertence a jobs.
    all: ["jobs"] as const,
    // Chave da listagem principal de jobs.
    list: () => ["jobs", "list"] as const,
  },
};

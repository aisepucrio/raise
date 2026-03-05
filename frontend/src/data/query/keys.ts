import { sourceIds, type SourceId } from "@/sources";

// Query keys are the "identidade" of each consulta in the cache of the React Query.
// Elas servem for:
// - separar caches for screen/filters/pagination
// - avoid collision between consultas different
// - permitir invalidte/refetch for prefixed (ex.: ["jobs"])
//
// without isso centered, the code funciona, mas fica mais easy errar
// (ex.: "date-range" vs "dateRange", "job" vs "jobs").

// Esta function is the "factory":
// dado the source ("github", "jira", etc), ela returns the object with the
// functions of key daquele source.
//
// Example:
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

// here Buildsmos the object that vai ficar assim:
// {
//   github: { overview, dateRange, graph, preview },
//   jira: { ... },
//   stackoverflow: { ... }
// }
const sourceQueryKeys = {} as Record<
  SourceId,
  ReturnType<typeof createSourceQueryKeys>
>;

// for each source definido in "@/sources", criamos automaticamente seu grupo
// of query keys. Isso avoids repetir manualmente github/jira/stackoverflow.
// OBS: for isso is considerado that there is the standardization between the keys of each source (overview, dateRange, graph, preview).
for (const source of sourceIds) {
  sourceQueryKeys[source] = createSourceQueryKeys(source);
}

// Objeat the end used pela application:
// - traz the keys of each source (github/jira/stackoverflow)
// - adds also the keys specific of jobs
export const queryKeys = {
  ...sourceQueryKeys,
  jobs: {
    // Prefixed for invalidr tudo that pertence the jobs.
    all: ["jobs"] as const,
    // key of the listing main of jobs.
    list: () => ["jobs", "list"] as const,
  },
};

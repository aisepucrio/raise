import { sourceIds, type SourceId } from "@/sources";

// Query keys are the identity of each query in the React Query cache.
// They are used to:
// - separate caches by screen/filters/pagination
// - avoid collisions between different queries
// - allow prefix-based invalidation/refetch (for example: ["jobs"])
//
// Without a centralized definition, the code still works, but it becomes
// easier to make mistakes (for example: "date-range" vs "dateRange",
// "job" vs "jobs").

// This function is the factory:
// given a source ("github", "jira", etc), it returns that source's
// query-key builder functions.
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

// Here we build an object in this shape:
// {
//   github: { overview, dateRange, graph, preview },
//   jira: { ... },
//   stackoverflow: { ... }
// }
const sourceQueryKeys = {} as Record<
  SourceId,
  ReturnType<typeof createSourceQueryKeys>
>;

// For each source defined in "@/sources", we automatically create its
// query-key group. This avoids manually repeating github/jira/stackoverflow.
// Note: this assumes standardized keys for each source
// (overview, dateRange, graph, preview).
for (const source of sourceIds) {
  sourceQueryKeys[source] = createSourceQueryKeys(source);
}

// Final object used by the application:
// - includes keys for each source (github/jira/stackoverflow)
// - also includes jobs-specific keys
export const queryKeys = {
  ...sourceQueryKeys,
  jobs: {
    // Prefix used to invalidate everything related to jobs.
    all: ["jobs"] as const,
    // Key for the main jobs list query.
    list: () => ["jobs", "list"] as const,
  },
};

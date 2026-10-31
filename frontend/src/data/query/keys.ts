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
  auth: {
    me: () => ["auth", "me"] as const,
  },
  users: {
    all: ["users"] as const,
  },
  // Go platform data, keyed by platform rather than frontend source: the
  // GitHub screens read both `git` and `github`.
  dashboard: {
    all: ["dashboard"] as const,
    cards: (platform: string, params?: unknown) =>
      ["dashboard", platform, "cards", params ?? null] as const,
    graph: (platform: string, params?: unknown) =>
      ["dashboard", platform, "graph", params ?? null] as const,
    dateRange: (platform: string, params?: unknown) =>
      ["dashboard", platform, "date-range", params ?? null] as const,
  },
  datasets: {
    all: ["datasets"] as const,
    catalogue: (platform: string) => ["datasets", platform, "catalogue"] as const,
    preview: (platform: string, dataset: string, params?: unknown) =>
      ["datasets", platform, "preview", dataset, params ?? null] as const,
  },
  collections: {
    // Prefix used to invalidate everything related to collections.
    all: ["collections"] as const,
    list: () => ["collections", "list"] as const,
    errors: (id: number) => ["collections", "errors", id] as const,
  },
  repositories: {
    all: ["repositories"] as const,
  },
  platforms: {
    all: ["platforms"] as const,
  },
  credentials: {
    all: ["credentials"] as const,
  },
};

// Query keys are the identity of each query in the React Query cache.
// They are used to:
// - separate caches by screen/filters/pagination
// - avoid collisions between different queries
// - allow prefix-based invalidation/refetch (for example: ["collections"])
//
// Without a centralized definition, the code still works, but it becomes
// easier to make mistakes (for example: "date-range" vs "dateRange",
// "job" vs "jobs").

export const queryKeys = {
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
    data: (id: number) => ["repositories", "data", id] as const,
  },
  platforms: {
    all: ["platforms"] as const,
  },
  credentials: {
    all: ["credentials"] as const,
  },
};

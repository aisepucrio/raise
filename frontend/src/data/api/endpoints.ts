import type { SectionPreviewIdBySource, SourceId } from "@/sources";

export type Source = SourceId;
export type SectionBySource = SectionPreviewIdBySource;
export type GithubSection = SectionBySource["github"];
export type JiraSection = SectionBySource["jira"];
export type StackOverflowSection = SectionBySource["stackoverflow"];

// Platforms of the Go API (`GET /api/platforms`). A frontend source can read
// several: the GitHub screens combine `git` (commits) and `github`.
export type PlatformId = "git" | "github" | "gitlab" | "jira" | "stackoverflow";

export const endpoints = {
  // ==> AUTH
  login: () => "/api/auth/login",
  logout: () => "/api/auth/logout",
  me: () => "/api/auth/me",
  changePassword: () => "/api/auth/password",
  users: () => "/api/users",

  // ==> PLATFORMS AND CREDENTIALS
  platforms: () => "/api/platforms",
  credentials: () => "/api/credentials",
  credential: (id: number) => `/api/credentials/${id}`,
  testCredential: (id: number) => `/api/credentials/${id}/test`,

  // ==> DASHBOARDS (every platform with `has_dashboard`)
  dashboard: (platform: PlatformId) => `/api/${platform}/dashboard`,
  dashboardGraph: (platform: PlatformId) => `/api/${platform}/dashboard/graph`,
  dashboardDateRange: (platform: PlatformId) =>
    `/api/${platform}/dashboard/date-range`,

  // ==> DATASETS (preview and export)
  datasets: (platform: PlatformId) => `/api/${platform}/preview`,
  datasetPreview: (platform: PlatformId, dataset: string) =>
    `/api/${platform}/preview/${dataset}`,
  datasetExport: (platform: PlatformId, dataset: string) =>
    `/api/${platform}/export/${dataset}`,

  // ==> COLLECTIONS
  collections: () => "/api/collections",
  cancelCollection: (id: number) => `/api/collections/${id}/cancel`,
  collectionErrors: (id: number) => `/api/collections/${id}/errors`,

  // ==> DOCS
  apiDocs: () => "/api/docs",

  // ==> LEGACY (Django). Used only by the Jira and Stack Overflow modules,
  // whose Go collection jobs don't exist yet; their screens are not shown.
  legacy: {
    dashboard: (source: Source) => `/api/${source}/dashboard/`,
    dashboardGraph: (source: Source) => `/api/${source}/dashboard/graph/`,
    dateRange: (source: Source) => `/api/${source}/date-range/`,
    collect: (source: Source) => `/api/${source}/collect/`,
    previewList: <S extends Source>(source: S, section: SectionBySource[S]) =>
      `/api/${source}/${section}/`,
    export: (source: Source) => `/api/${source}/export/`,
  },
} as const;

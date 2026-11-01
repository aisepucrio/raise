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

  // ==> REPOSITORIES (listed through git's `repositories` dataset)
  repository: (id: number) => `/api/repositories/${id}`,
  repositoryData: (id: number) => `/api/repositories/${id}/data`,
  repositoryDataPart: (id: number, platform: PlatformId, key: string) =>
    `/api/repositories/${id}/data/${platform}/${encodeURIComponent(key)}`,

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
} as const;

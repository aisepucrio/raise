import type { SectionPreviewIdBySource, SourceId } from "@/sources";

export type Source = SourceId;
export type SectionBySource = SectionPreviewIdBySource;
export type GithubSection = SectionBySource["github"];
export type JiraSection = SectionBySource["jira"];
export type StackOverflowSection = SectionBySource["stackoverflow"];

export const endpoints = {
  // ==> OVERVIEW
  dashboard: (source: Source) => `/api/${source}/dashboard`,
  dashboardGraph: (source: Source) => `/api/${source}/dashboard/graph`,
  dateRange: (source: Source) => `/api/${source}/date-range`,

  // ==> PREVIEW
  previewList: <S extends Source>(source: S, section: SectionBySource[S]) =>
    `/api/${source}/${section}`,
  export: (source: Source) => `/api/${source}/export/`,

  // ==> COLLECT
  collect: (source: Source) => `/api/${source}/collect/`,
  // HARDCODE TEMPORARIO: O SO AINDA USA /COLLECT/ADVANCED POR COMPATIBILIDADE COM A IMPLEMENTACAO LEGADA.
  // FUTURO: MERGEAR COM /COLLECT USANDO APENAS PAYLOAD.
  collectAdvanced: (source: Source) => `/api/${source}/collect/advanced/`,

  // ==> JOBS
  jobs: () => `/api/jobs/`,
  stopJob: (taskId: string) => `/api/jobs/tasks/${taskId}/`,
  restartCollection: (taskId: string) =>
    `/api/jobs/restart-collection/${taskId}/`,
} as const;

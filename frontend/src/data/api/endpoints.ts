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

  // ==> DATE RANGE (OVERVIEW / PREVIEW)
  dateRange: (source: Source) => `/api/${source}/date-range`,

  // ==> COLLECT
  collect: (source: Source) => `/api/${source}/collect/`,

  // TEMPORARY HARDCODE: Stack Overflow still uses /COLLECT/ADVANCED for legacy compatibility.
  // FUTURE: merge into /COLLECT using payload only.
  collectAdvanced: (source: Source) => `/api/${source}/collect/advanced/`,

  // ==> PREVIEW
  previewList: <S extends Source>(source: S, section: SectionBySource[S]) =>
    `/api/${source}/${section}`,
  export: (source: Source) => `/api/${source}/export/`,

  // ==> JOBS
  jobs: () => `/api/jobs/`,
  stopJob: (taskId: string) => `/api/jobs/tasks/${taskId}/`,
  restartCollection: (taskId: string) =>
    `/api/jobs/restart-collection/${taskId}/`,
} as const;

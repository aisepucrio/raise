import type { SourceId } from "@/sources";

export type Source = SourceId;

// Sections para cada source (preview)
export type GithubSection = "issues" | "pull-requests" | "commits" | "users";
export type JiraSection = "users" | "issues" | "comments" | "sprints";
export type StackOverflowSection = "questions";

/* Mapa Source -> Sections válidas */
type SectionBySource = {
  github: GithubSection;
  jira: JiraSection;
  stackoverflow: StackOverflowSection;
};

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

  // ==> JOBS
  jobs: () => `/api/jobs/`,
  stopJob: (taskId: string) => `/api/jobs/tasks/${taskId}/`,
  restartCollection: (taskId: string) =>
    `/api/jobs/restart-collection/${taskId}/`,
} as const;

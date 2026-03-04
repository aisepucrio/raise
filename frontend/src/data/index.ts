// Reexporta hooks e mutations para consumo direto via "@/data".
export * from "./modules/github/githubQueries";
export * from "./modules/github/githubMutations";
export * from "./modules/jira/jiraQueries";
export * from "./modules/jira/jiraMutations";
export * from "./modules/jobs/jobsQueries";
export * from "./modules/jobs/jobsMutations";
export * from "./modules/stackoverflow/stackoverflowQueries";
export * from "./modules/stackoverflow/stackoverflowMutations";

// Reexporta os types dos módulos no mesmo ponto de entrada compartilhado.
export type {
  GithubCollectBody,
  GithubCollectType,
  GithubDateRangeParams,
  GithubExportBody,
  GithubGraphParams,
  GithubGraphResponse,
  GithubOverviewParams,
  GithubOverviewResponse,
  GithubPreviewParams,
  GithubPreviewResponse,
  GithubPreviewRow,
  GithubRepository,
} from "./modules/github";
export type {
  JiraCollectBody,
  JiraDateRangeParams,
  JiraGraphParams,
  JiraOverviewParams,
  JiraOverviewProject,
  JiraOverviewResponse,
  JiraPreviewParams,
  JiraPreviewResponse,
  JiraPreviewRow,
  JiraProject,
} from "./modules/jira";
export type { JobsListItem, JobsListResponse } from "./modules/jobs";
export type {
  StackOverflowAdvancedCollectBody,
  StackOverflowAdvancedCollectFilters,
  StackOverflowCollectBody,
  StackOverflowDateRangeParams,
  StackOverflowGraphParams,
  StackOverflowOverviewParams,
  StackOverflowOverviewQuestion,
  StackOverflowOverviewResponse,
  StackOverflowPreviewParams,
  StackOverflowPreviewResponse,
  StackOverflowPreviewRow,
} from "./modules/stackoverflow";
export type { GithubSection, JiraSection, StackOverflowSection } from "./api/endpoints";

// Helper de erro usado por componentes/telas.
export { getQueryErrorMessage } from "./query/errors";
export { queryClient } from "./query/client";

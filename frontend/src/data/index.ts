// Re-exports hooks and mutations for direct usage via "@/data".
export * from "./modules/github/githubQueries";
export * from "./modules/github/githubMutations";
export * from "./modules/jira/jiraQueries";
export * from "./modules/jira/jiraMutations";
export * from "./modules/jobs/jobsQueries";
export * from "./modules/jobs/jobsMutations";
export * from "./modules/stackoverflow/stackoverflowQueries";
export * from "./modules/stackoverflow/stackoverflowMutations";

// Re-exports module types from the same shared entry point.
export type {
  ApiDateRangeResponse,
  DashboardEntity,
  DashboardGraphInterval,
  DashboardGraphParams,
  DashboardGraphResponse,
  DashboardOverviewResponse,
  DateFilterRange,
  HookQueryOptions,
} from "./modules/shared";
export type {
  GithubCollectBody,
  GithubCollectType,
  GithubDateRangeParams,
  GithubExportBody,
  GithubOverviewParams,
  GithubPreviewParams,
  GithubPreviewResponse,
  GithubPreviewRow,
} from "./modules/github";
export type {
  JiraCollectBody,
  JiraDateRangeParams,
  JiraOverviewParams,
  JiraPreviewParams,
  JiraPreviewResponse,
  JiraPreviewRow,
} from "./modules/jira";
export type { JobsListItem, JobsListResponse } from "./modules/jobs";
export type {
  StackOverflowCollectBody,
  StackOverflowCollectFilters,
  StackOverflowDateRangeParams,
  StackOverflowOverviewParams,
  StackOverflowPreviewParams,
  StackOverflowPreviewResponse,
  StackOverflowPreviewRow,
} from "./modules/stackoverflow";
export type { GithubSection, JiraSection, StackOverflowSection } from "./api/endpoints";

// Error helper used by components/screens.
export { getQueryErrorMessage } from "./query/errors";
export { queryClient } from "./query/client";

// Re-exports hooks and mutations for direct usage via "@/data".
export * from "./modules/github/githubQueries";
export * from "./modules/github/githubMutations";
export * from "./modules/gitlab/gitlabQueries";
export * from "./modules/gitlab/gitlabMutations";
export * from "./modules/jira/jiraQueries";
export * from "./modules/jira/jiraMutations";
export * from "./modules/jobs/jobsQueries";
export * from "./modules/jobs/jobsMutations";
export * from "./modules/stackoverflow/stackoverflowQueries";
export * from "./modules/stackoverflow/stackoverflowMutations";

// Re-exports module types from the same shared entry point.
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
  GitlabCollectBody,
  GitlabCollectType,
  GitlabDateRangeParams,
  GitlabExportBody,
  GitlabGraphParams,
  GitlabGraphResponse,
  GitlabOverviewParams,
  GitlabOverviewResponse,
  GitlabPreviewParams,
  GitlabPreviewResponse,
  GitlabPreviewRow,
  GitlabRepository,
} from "./modules/gitlab";
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
export type {
  GithubSection,
  GitlabSection,
  JiraSection,
  StackOverflowSection,
} from "./api/endpoints";

// Error helper used by components/screens.
export { getQueryErrorMessage } from "./query/errors";
export { queryClient } from "./query/client";

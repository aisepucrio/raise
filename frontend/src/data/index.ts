import * as githubQueries from "./modules/github/githubQueries";
import * as githubMutations from "./modules/github/githubMutations";

import * as jiraQueries from "./modules/jira/jiraQueries";
import * as jiraMutations from "./modules/jira/jiraMutations";

import * as stackoverflowQueries from "./modules/stackoverflow/stackoverflowQueries";
import * as stackoverflowMutations from "./modules/stackoverflow/stackoverflowMutations";

import * as jobsQueries from "./modules/jobs/jobsQueries";
import * as jobsMutations from "./modules/jobs/jobsMutations";

// Cada módulo expõe queries e mutations com nomes explícitos.
export const githubModule = { githubQueries, githubMutations };
export const jiraModule = { jiraQueries, jiraMutations };
export const stackoverflowModule = {
  stackoverflowQueries,
  stackoverflowMutations,
};
export const jobsModule = { jobsQueries, jobsMutations };

// Helper de erro usado por componentes/telas.
export { getQueryErrorMessage } from "./query/errors";

// Reexports para imports diretos de hooks.
export * from "./modules/github/githubQueries";
export * from "./modules/github/githubMutations";
export * from "./modules/jira/jiraQueries";
export * from "./modules/jira/jiraMutations";
export * from "./modules/stackoverflow/stackoverflowQueries";
export * from "./modules/stackoverflow/stackoverflowMutations";
export * from "./modules/jobs/jobsQueries";
export * from "./modules/jobs/jobsMutations";

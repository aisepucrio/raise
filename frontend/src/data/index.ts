import * as githubQueries from "./modules/github/githubQueries";
import * as githubMutations from "./modules/github/githubMutations";

import * as jiraQueries from "./modules/jira/jiraQueries";
import * as jiraMutations from "./modules/jira/jiraMutations";

import * as stackoverflowQueries from "./modules/stackoverflow/stackoverflowQueries";
import * as stackoverflowMutations from "./modules/stackoverflow/stackoverflowMutations";

import * as jobsQueries from "./modules/jobs/jobsQueries";
import * as jobsMutations from "./modules/jobs/jobsMutations";

// Cada módulo expõe queries e mutations com nomes explícitos.
export const githubModule = { queries: githubQueries, mutations: githubMutations };
export const jiraModule = { queries: jiraQueries, mutations: jiraMutations };
export const stackoverflowModule = {
  queries: stackoverflowQueries,
  mutations: stackoverflowMutations,
};
export const jobsModule = { queries: jobsQueries, mutations: jobsMutations };

// Helper de erro usado por componentes/telas.
export { getQueryErrorMessage } from "./query/errors";

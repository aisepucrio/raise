import { githubService } from "./githubService";
import { jiraService } from "./jiraService";
import { jobsService } from "./jobsService";
import { stackoverflowService } from "./stackoverflowService";

export const services = {
  // Jobs e global na API, por isso fica fora dos services por fonte.
  jobs: jobsService,
  github: githubService,
  jira: jiraService,
  stackoverflow: stackoverflowService,
};

export * from "./githubService";
export * from "./jiraService";
export * from "./stackoverflowService";
export * from "./jobsService";

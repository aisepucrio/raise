import type { ComponentType } from "react";
import type { SectionIdBySource, SourceId } from "./index";
import GithubCollect from "./github/GithubCollect";
import GithubOverview from "./github/GithubOverview";
import {
  GithubPreviewCommits,
  GithubPreviewIssues,
  GithubPreviewPullRequests,
  GithubPreviewUsers,
} from "./github/GithubPreview/index";
import JiraCollect from "./jira/JiraCollect";
import JiraOverview from "./jira/JiraOverview";
import {
  JiraPreviewComments,
  JiraPreviewIssues,
  JiraPreviewSprints,
  JiraPreviewUsers,
} from "./jira/JiraPreview/index";
import StackoverflowCollect from "./stackoverflow/StackoverflowCollect";
import StackoverflowOverview from "./stackoverflow/StackoverflowOverview";
import { StackoverflowPreviewQuestions } from "./stackoverflow/StackoverflowPreview/index";

// Mapeia cada sourceId para módulos de UI de Overview e Collect.
type SourceUiModuleSet = {
  collect: ComponentType;
  overview: ComponentType;
};

export const sourceUiModules: Record<SourceId, SourceUiModuleSet> = {
  github: {
    collect: GithubCollect,
    overview: GithubOverview,
  },
  jira: {
    collect: JiraCollect,
    overview: JiraOverview,
  },
  stackoverflow: {
    collect: StackoverflowCollect,
    overview: StackoverflowOverview,
  },
};

// Mapeia cada sourceId para módulos de Preview por section.
type SourcePreviewUiModuleSet = {
  [S in SourceId]: Record<SectionIdBySource[S], ComponentType>;
};

export const sourcePreviewUiModules: SourcePreviewUiModuleSet = {
  github: {
    issues: GithubPreviewIssues,
    "pull-requests": GithubPreviewPullRequests,
    commits: GithubPreviewCommits,
    users: GithubPreviewUsers,
  },
  jira: {
    users: JiraPreviewUsers,
    issues: JiraPreviewIssues,
    comments: JiraPreviewComments,
    sprints: JiraPreviewSprints,
  },
  stackoverflow: {
    questions: StackoverflowPreviewQuestions,
  },
};

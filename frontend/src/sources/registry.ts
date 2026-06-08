import type { ComponentType } from "react";
import type { SectionPreviewIdBySource, SourceId } from "./index";
import GithubCollect from "./github/GithubCollect";
import GithubOverview from "./github/GithubOverview";
import {
  GithubPreviewCommits,
  GithubPreviewIssues,
  GithubPreviewPullRequests,
  GithubPreviewUsers,
} from "./github/GithubPreview/index";
import GitlabCollect from "./gitlab/GitlabCollect";
import GitlabOverview from "./gitlab/GitlabOverview";
import {
  GitlabPreviewBranches,
  GitlabPreviewCommits,
  GitlabPreviewIssues,
  GitlabPreviewMergeRequests,
  GitlabPreviewMetadata,
} from "./gitlab/GitlabPreview/index";
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

// maps each sourceId for modules of UI of overview and Collect.
type SourceUiModuleSet = {
  collect: ComponentType;
  overview: ComponentType;
};

export const sourceUiModules: Record<SourceId, SourceUiModuleSet> = {
  github: {
    collect: GithubCollect,
    overview: GithubOverview,
  },
  gitlab: {
    collect: GitlabCollect,
    overview: GitlabOverview,
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

// maps each sourceId for modules of preview for sectionPreview.
type SourcePreviewUiModuleSet = {
  [S in SourceId]: Record<SectionPreviewIdBySource[S], ComponentType>;
};

export const sourceSectionPreviewUiModules: SourcePreviewUiModuleSet = {
  github: {
    issues: GithubPreviewIssues,
    "pull-requests": GithubPreviewPullRequests,
    commits: GithubPreviewCommits,
    users: GithubPreviewUsers,
  },
  gitlab: {
    metadata: GitlabPreviewMetadata,
    issues: GitlabPreviewIssues,
    "merge-requests": GitlabPreviewMergeRequests,
    commits: GitlabPreviewCommits,
    branches: GitlabPreviewBranches,
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

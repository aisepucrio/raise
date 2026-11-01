import type { ComponentType } from "react";
import type { SectionPreviewIdBySource, SourceId } from "./index";
import GithubCollect from "./github/GithubCollect";
import GithubOverview from "./github/GithubOverview";
import GithubRepositories from "./github/GithubRepositories";
import { githubPreviewModules } from "./github/GithubPreview/index";

// maps each sourceId for modules of UI of overview, Collect and the entities
// page (what the source mines from: repositories, projects, tags; titled by
// sourceEntityLabels). Sources without modules (not ported to the Go backend
// yet) show a notice instead.
type SourceUiModuleSet = {
  collect: ComponentType;
  overview: ComponentType;
  entities?: ComponentType;
};

export const sourceUiModules: Partial<Record<SourceId, SourceUiModuleSet>> = {
  github: {
    collect: GithubCollect,
    overview: GithubOverview,
    entities: GithubRepositories,
  },
};

// maps each sourceId for modules of preview for sectionPreview.
type SourcePreviewUiModuleSet = {
  [S in SourceId]: Record<SectionPreviewIdBySource[S], ComponentType>;
};

export const sourceSectionPreviewUiModules: Partial<SourcePreviewUiModuleSet> = {
  github: githubPreviewModules,
};

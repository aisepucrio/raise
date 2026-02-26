import type { ComponentType } from "react";
import type { SourceId } from "./index";
import GithubCollect from "./github/GithubCollect";
import GithubOverview from "./github/GithubOverview";
import GithubPreview from "./github/GithubPreview";
import JiraCollect from "./jira/JiraCollect";
import JiraOverview from "./jira/JiraOverview";
import JiraPreview from "./jira/JiraPreview";
import StackoverflowCollect from "./stackoverflow/StackoverflowCollect";
import StackoverflowOverview from "./stackoverflow/StackoverflowOverview";
import StackoverflowPreview from "./stackoverflow/StackoverflowPreview";

// Mapeia cada sourceId para seus respectivos módulos de UI.
// Utilizado para renderizar as telas de Overview, Collect e Preview dinamicamente com base no source selecionado.

type SourceUiModuleSet = {
  collect: ComponentType;
  overview: ComponentType;
  preview: ComponentType;
};

export const sourceUiModules: Record<SourceId, SourceUiModuleSet> = {
  github: {
    collect: GithubCollect,
    overview: GithubOverview,
    preview: GithubPreview,
  },
  jira: {
    collect: JiraCollect,
    overview: JiraOverview,
    preview: JiraPreview,
  },
  stackoverflow: {
    collect: StackoverflowCollect,
    overview: StackoverflowOverview,
    preview: StackoverflowPreview,
  },
};

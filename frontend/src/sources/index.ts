// Sources available in the application.
export const sourceIds = ["github", "jira", "stackoverflow"] as const;

// Sections of preview available for each source.
export const sectionPreviewIdsBySource = {
  github: ["issues", "pull-requests", "commits", "users"],
  jira: ["users", "issues", "comments", "sprints"],
  stackoverflow: ["questions"],
} as const satisfies Record<SourceId, readonly string[]>;

// Tipo that representa the IDs of the sources.
export type SourceId = (typeof sourceIds)[number];

// Tipo that representa the IDs of the sections of preview for each source.
export type SectionPreviewIdBySource = {
  [S in SourceId]: (typeof sectionPreviewIdsBySource)[S][number];
};

// Labels for each source, usados in the UI.
export const sourceLabels: Record<SourceId, string> = {
  github: "GitHub",
  jira: "Jira",
  stackoverflow: "Stack Overflow",
};

// Labels for each section of preview of each source, usados in the UI.
export const sectionPreviewLabelsBySource: {
  [S in SourceId]: Record<SectionPreviewIdBySource[S], string>;
} = {
  github: {
    issues: "Issues",
    "pull-requests": "Pull requests",
    commits: "Commits",
    users: "Users",
  },
  jira: {
    users: "Users",
    issues: "Issues",
    comments: "Comments",
    sprints: "Sprints",
  },
  stackoverflow: {
    questions: "Questions",
  },
};

// Source default for the application, used in the start of the application.
export const defaultSourceId: SourceId = sourceIds[0];

// Section of preview default for each source, used when the section not is especifieach (when se switch of source, for Example).
export const defaultSectionPreviewIdBySource: {
  [S in SourceId]: SectionPreviewIdBySource[S];
} = {
  github: sectionPreviewIdsBySource.github[0],
  jira: sectionPreviewIdsBySource.jira[0],
  stackoverflow: sectionPreviewIdsBySource.stackoverflow[0],
};

// maps id and label. useful for dropdowns and forms.
export const sourceOptions = sourceIds.map((id) => ({
  id,
  label: sourceLabels[id],
}));

// maps id and label for sections of preview of each source. useful for dropdowns and forms.
export const sectionPreviewOptionsBySource = {
  github: sectionPreviewIdsBySource.github.map((id) => ({
    id,
    label: sectionPreviewLabelsBySource.github[id],
  })),
  jira: sectionPreviewIdsBySource.jira.map((id) => ({
    id,
    label: sectionPreviewLabelsBySource.jira[id],
  })),
  stackoverflow: sectionPreviewIdsBySource.stackoverflow.map((id) => ({
    id,
    label: sectionPreviewLabelsBySource.stackoverflow[id],
  })),
} as const satisfies {
  [S in SourceId]: readonly {
    id: SectionPreviewIdBySource[S];
    label: string;
  }[];
};

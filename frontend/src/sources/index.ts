// Sources available in the application.
export const sourceIds = ["github", "gitlab", "jira", "stackoverflow"] as const;

// Sections of preview available for each source.
export const sectionPreviewIdsBySource = {
  github: ["issues", "pull-requests", "commits", "users"],
  gitlab: ["metadata", "issues", "merge-requests", "commits", "branches"],
  jira: ["users", "issues", "comments", "sprints"],
  stackoverflow: ["questions"],
} as const satisfies Record<SourceId, readonly string[]>;

// Type representing source IDs.
export type SourceId = (typeof sourceIds)[number];

// Type representing preview-section IDs for each source.
export type SectionPreviewIdBySource = {
  [S in SourceId]: (typeof sectionPreviewIdsBySource)[S][number];
};

// Labels for each source, used in the UI.
export const sourceLabels: Record<SourceId, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  jira: "Jira",
  stackoverflow: "Stack Overflow",
};

// Labels for each source preview section, used in the UI.
export const sectionPreviewLabelsBySource: {
  [S in SourceId]: Record<SectionPreviewIdBySource[S], string>;
} = {
  github: {
    issues: "Issues",
    "pull-requests": "Pull requests",
    commits: "Commits",
    users: "Users",
  },
  gitlab: {
    metadata: "Metadata",
    issues: "Issues",
    "merge-requests": "Merge Requests",
    commits: "Commits",
    branches: "Branches",
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

// Default source used when the application starts.
export const defaultSourceId: SourceId = sourceIds[0];

// Default preview section for each source, used when no section is specified (for example when switching source).
export const defaultSectionPreviewIdBySource: {
  [S in SourceId]: SectionPreviewIdBySource[S];
} = {
  github: sectionPreviewIdsBySource.github[0],
  gitlab: sectionPreviewIdsBySource.gitlab[0],
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
  gitlab: sectionPreviewIdsBySource.gitlab.map((id) => ({
    id,
    label: sectionPreviewLabelsBySource.gitlab[id],
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

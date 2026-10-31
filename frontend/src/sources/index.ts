// Sources available in the application.
export const sourceIds = ["github", "jira", "stackoverflow"] as const;

// Sections of preview available for each source.
export const sectionPreviewIdsBySource = {
  github: ["issues", "pull-requests", "commits", "users"],
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

// Sources whose Go backend doesn't exist yet, with the reason shown in the UI.
// Their screens and data modules still target the legacy Django API, so they
// are replaced by a notice until their collection jobs are ported
// (backend-go architecture.md §12).
export const unavailableSourceReasons: Partial<Record<SourceId, string>> = {
  jira: "Jira mining isn't available in the new backend yet.",
  stackoverflow: "Stack Overflow mining isn't available in the new backend yet.",
};

export function isSourceAvailable(source: SourceId) {
  return !(source in unavailableSourceReasons);
}

// Default source used when the application starts.
export const defaultSourceId: SourceId = sourceIds[0];

// Default preview section for each source, used when no section is specified (for example when switching source).
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
  label: isSourceAvailable(id)
    ? sourceLabels[id]
    : `${sourceLabels[id]} (unavailable)`,
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

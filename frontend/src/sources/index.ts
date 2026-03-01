// Sources disponíveis na aplicação.
export const sourceIds = ["github", "jira", "stackoverflow"] as const;

// Sections de preview disponíveis para cada source.
export const sectionPreviewIdsBySource = {
  github: ["issues", "pull-requests", "commits", "users"],
  jira: ["users", "issues", "comments", "sprints"],
  stackoverflow: ["questions"],
} as const satisfies Record<SourceId, readonly string[]>;

// Tipo que representa os IDs das sources.
export type SourceId = (typeof sourceIds)[number];

// Tipo que representa os IDs das sections de preview para cada source.
export type SectionPreviewIdBySource = {
  [S in SourceId]: (typeof sectionPreviewIdsBySource)[S][number];
};

// Labels para cada source, usados na UI.
export const sourceLabels: Record<SourceId, string> = {
  github: "GitHub",
  jira: "Jira",
  stackoverflow: "Stack Overflow",
};

// Labels para cada section de preview de cada source, usados na UI.
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

// Source default para a aplicação, usada no início da aplicação.
export const defaultSourceId: SourceId = sourceIds[0];

// Section de preview default para cada source, usada quando a section não é especificada (quando se troca de source, por exemplo).
export const defaultSectionPreviewIdBySource: {
  [S in SourceId]: SectionPreviewIdBySource[S];
} = {
  github: sectionPreviewIdsBySource.github[0],
  jira: sectionPreviewIdsBySource.jira[0],
  stackoverflow: sectionPreviewIdsBySource.stackoverflow[0],
};

// Mapeia id e label. Útil para dropdowns e formulários.
export const sourceOptions = sourceIds.map((id) => ({
  id,
  label: sourceLabels[id],
}));

// Mapeia id e label para sections de preview de cada source. Útil para dropdowns e formulários.
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

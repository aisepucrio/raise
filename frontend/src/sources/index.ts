// Sources disponíveis na aplicação.
export const sourceIds = ["github", "jira", "stackoverflow"] as const;

// Sections disponíveis para cada source.
export const sectionIdsBySource = {
  github: ["issues", "pull-requests", "commits", "users"],
  jira: ["users", "issues", "comments", "sprints"],
  stackoverflow: ["questions"],
} as const satisfies Record<SourceId, readonly string[]>;

// Tipo que representa os IDs das sources.
export type SourceId = (typeof sourceIds)[number];

// Tipo que representa os IDs das sections para cada source.
export type SectionIdBySource = {
  [S in SourceId]: (typeof sectionIdsBySource)[S][number];
};

// Labels para cada source, usados na UI.
export const sourceLabels: Record<SourceId, string> = {
  github: "GitHub",
  jira: "Jira",
  stackoverflow: "Stack Overflow",
};

// Labels para cada section de cada source, usados na UI.
export const sectionLabelsBySource: {
  [S in SourceId]: Record<SectionIdBySource[S], string>;
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

// Section default para cada source, usada quando a section não é especificada (quando se troca de source, por exemplo).
export const defaultSectionIdBySource: {
  [S in SourceId]: SectionIdBySource[S];
} = {
  github: sectionIdsBySource.github[0],
  jira: sectionIdsBySource.jira[0],
  stackoverflow: sectionIdsBySource.stackoverflow[0],
};

// Mapeia id e label. Útil para dropdowns e formulários.
export const sourceOptions = sourceIds.map((id) => ({
  id,
  label: sourceLabels[id],
}));

// Mapeia id e label para sections de cada source. Útil para dropdowns e formulários.
export const sectionOptionsBySource = {
  github: sectionIdsBySource.github.map((id) => ({
    id,
    label: sectionLabelsBySource.github[id],
  })),
  jira: sectionIdsBySource.jira.map((id) => ({
    id,
    label: sectionLabelsBySource.jira[id],
  })),
  stackoverflow: sectionIdsBySource.stackoverflow.map((id) => ({
    id,
    label: sectionLabelsBySource.stackoverflow[id],
  })),
} as const satisfies {
  [S in SourceId]: readonly {
    id: SectionIdBySource[S];
    label: string;
  }[];
};

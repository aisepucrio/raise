// Sources available in the application.
export const sourceIds = ["github", "jira", "stackoverflow"] as const;

// Sections of preview available for each source. GitHub's are every git and
// GitHub dataset (backend-go architecture.md §9.2), in the order of the
// sidebar, grouped by platform (sectionPreviewGroupsBySource).
export const sectionPreviewIdsBySource = {
  github: [
    "repositories",
    "commits",
    "commit-files",
    "commit-diffs",
    "refs",
    "github-repositories",
    "issues",
    "issue-comments",
    "issue-events",
    "pull-requests",
    "pull-request-commits",
    "pull-request-reviews",
    "pull-request-review-comments",
    "github-commits",
    "releases",
    "release-assets",
    "users",
  ],
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
    repositories: "Repositories",
    commits: "Commits",
    "commit-files": "Commit files",
    "commit-diffs": "Commit diffs",
    refs: "Branches and tags",
    "github-repositories": "Repository details",
    issues: "Issues",
    "issue-comments": "Issue comments",
    "issue-events": "Timeline events",
    "pull-requests": "Pull requests",
    "pull-request-commits": "PR commits",
    "pull-request-reviews": "PR reviews",
    "pull-request-review-comments": "PR review comments",
    "github-commits": "Commit authors and PR links",
    releases: "Releases",
    "release-assets": "Release assets",
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

// Preview sections the sidebar folds under "Show N more" until asked: the
// detail tables most analyses don't start from. The rest are always shown.
export const foldedSectionPreviewIdsBySource: {
  [S in SourceId]?: readonly SectionPreviewIdBySource[S][];
} = {
  github: [
    "repositories",
    "commit-files",
    "commit-diffs",
    "refs",
    "issue-comments",
    "issue-events",
    "pull-request-commits",
    "pull-request-reviews",
    "pull-request-review-comments",
    "github-commits",
    "release-assets",
  ],
};

export function isSectionPreviewFolded<S extends SourceId>(
  source: S,
  section: SectionPreviewIdBySource[S],
) {
  const folded = foldedSectionPreviewIdsBySource[source] as
    readonly string[] | undefined;
  return folded?.includes(section) ?? false;
}

// Headings that group a source's preview sections in the sidebar: a section
// starts a group when its heading differs from the previous section's.
export const sectionPreviewGroupsBySource: {
  [S in SourceId]?: Record<SectionPreviewIdBySource[S], string>;
} = {
  github: {
    repositories: "Git",
    commits: "Git",
    "commit-files": "Git",
    "commit-diffs": "Git",
    refs: "Git",
    "github-repositories": "GitHub",
    issues: "GitHub",
    "issue-comments": "GitHub",
    "issue-events": "GitHub",
    "pull-requests": "GitHub",
    "pull-request-commits": "GitHub",
    "pull-request-reviews": "GitHub",
    "pull-request-review-comments": "GitHub",
    "github-commits": "GitHub",
    releases: "GitHub",
    "release-assets": "GitHub",
    users: "GitHub",
  },
};

// What each source mines from, as named on that platform. The Platform group
// of the sidebar lists them under this name (/entities), where admins see
// what was collected for each and remove it.
export const sourceEntityLabels: Record<
  SourceId,
  { title: string; description: string }
> = {
  github: {
    title: "Repositories",
    description:
      "Every registered repository and what was collected for it. Remove a repository with its data, or only part of it.",
  },
  jira: {
    title: "Projects",
    description:
      "Every registered Jira project and what was collected for it.",
  },
  stackoverflow: {
    title: "Tags",
    description: "Every collected Stack Overflow tag and its questions.",
  },
};

// Sources whose Go backend doesn't exist yet, with the reason shown in the UI.
// They have no modules in registry.ts; their screens show a notice until
// their collection jobs are ported (backend-go architecture.md §12).
export const unavailableSourceReasons: Partial<Record<SourceId, string>> = {
  jira: "Jira mining isn't available in the new backend yet.",
  stackoverflow:
    "Stack Overflow mining isn't available in the new backend yet.",
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
  github: "issues",
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
    group: sectionPreviewGroupsBySource.github?.[id],
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
    group?: string;
  }[];
};

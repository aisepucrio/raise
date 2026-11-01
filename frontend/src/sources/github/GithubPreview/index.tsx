import type { ComponentType } from "react";

import type { SectionPreviewIdBySource } from "@/sources";
import { GithubPreview } from "./GithubPreview";

type GithubPreviewSection = {
  // The Go dataset behind the section: `git` for the repository's own
  // history, `github` for what GitHub adds.
  platform: "git" | "github";
  dataset: string;
  // Plural noun for the pagination footer and messages.
  itemsLabel: string;
};

// Every git and GitHub dataset (backend-go README, Previews and exports).
const sections: Record<SectionPreviewIdBySource["github"], GithubPreviewSection> = {
  repositories: { platform: "git", dataset: "repositories", itemsLabel: "repositories" },
  commits: { platform: "git", dataset: "commits", itemsLabel: "commits" },
  "commit-files": { platform: "git", dataset: "commit-files", itemsLabel: "files" },
  "commit-diffs": { platform: "git", dataset: "commit-diffs", itemsLabel: "diffs" },
  refs: { platform: "git", dataset: "refs", itemsLabel: "branches and tags" },
  "github-repositories": { platform: "github", dataset: "repositories", itemsLabel: "repositories" },
  issues: { platform: "github", dataset: "issues", itemsLabel: "issues" },
  "issue-comments": { platform: "github", dataset: "issue-comments", itemsLabel: "comments" },
  "issue-events": { platform: "github", dataset: "issue-events", itemsLabel: "events" },
  "pull-requests": { platform: "github", dataset: "pull-requests", itemsLabel: "pull requests" },
  "pull-request-commits": { platform: "github", dataset: "pull-request-commits", itemsLabel: "commits" },
  "pull-request-reviews": { platform: "github", dataset: "pull-request-reviews", itemsLabel: "reviews" },
  "pull-request-review-comments": {
    platform: "github",
    dataset: "pull-request-review-comments",
    itemsLabel: "review comments",
  },
  "github-commits": { platform: "github", dataset: "commits", itemsLabel: "commits" },
  releases: { platform: "github", dataset: "releases", itemsLabel: "releases" },
  "release-assets": { platform: "github", dataset: "release-assets", itemsLabel: "assets" },
  users: { platform: "github", dataset: "users", itemsLabel: "users" },
};

function sectionComponent(
  id: string,
  { platform, dataset, itemsLabel }: GithubPreviewSection,
): ComponentType {
  // One component per section, so switching sections remounts the preview
  // with fresh filters, sort and cursors.
  function GithubPreviewSection() {
    return (
      <GithubPreview
        idPrefix={`github-preview-${id}`}
        platform={platform}
        dataset={dataset}
        itemsLabel={itemsLabel}
        emptyStateMessage={`No ${itemsLabel} found for the selected filters.`}
        loadErrorMessage={`Failed to load ${itemsLabel}.`}
      />
    );
  }
  GithubPreviewSection.displayName = `GithubPreview(${id})`;
  return GithubPreviewSection;
}

export const githubPreviewModules = Object.fromEntries(
  Object.entries(sections).map(([id, section]) => [id, sectionComponent(id, section)]),
) as Record<SectionPreviewIdBySource["github"], ComponentType>;

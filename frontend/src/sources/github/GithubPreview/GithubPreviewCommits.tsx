import { GithubPreview } from "./GithubPreview";

export default function GithubPreviewCommits() {
  return (
    <GithubPreview
      idPrefix="github-preview-commits"
      platform="git"
      dataset="commits"
      itemsLabel="commits"
      emptyStateMessage="No commits found for the selected filters."
      loadErrorMessage="Failed to load GitHub commits."
    />
  );
}

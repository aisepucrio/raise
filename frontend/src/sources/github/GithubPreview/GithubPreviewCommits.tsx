import { GithubPreview } from "./GithubPreview";

export default function GithubPreviewCommits() {
  return (
    <GithubPreview
      idPrefix="github-preview-commits"
      previewSection="commits"
      itemsLabel="commits"
      emptyStateMessage="No commits found for the selected filters."
      loadErrorMessage="Failed to load GitHub commits."
      exportTable="githubcommit"
      exportFileNamePrefix="github-commits-preview"
      dateFilterField="date"
    />
  );
}

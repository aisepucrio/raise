import { GitlabPreview } from "./GitlabPreview";

export default function GitlabPreviewCommits() {
  return (
    <GitlabPreview
      idPrefix="gitlab-preview-commits"
      previewSection="commits"
      itemsLabel="commits"
      emptyStateMessage="No commits found for the selected filters."
      loadErrorMessage="Failed to load GitLab commits."
      exportTable="gitlabcommit"
      exportFileNamePrefix="gitlab-commits-preview"
      dateFilterField="date"
    />
  );
}

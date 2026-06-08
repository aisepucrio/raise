import { GitlabPreview } from "./GitlabPreview";

export default function GitlabPreviewIssues() {
  return (
    <GitlabPreview
      idPrefix="gitlab-preview-issues"
      previewSection="issues"
      itemsLabel="issues"
      emptyStateMessage="No issues found for the selected filters."
      loadErrorMessage="Failed to load GitLab issues."
      exportTable="gitlabissue"
      exportFileNamePrefix="gitlab-issues-preview"
      dateFilterField="created_at"
    />
  );
}

import { GitlabPreview } from "./GitlabPreview";

export default function GitlabPreviewMergeRequests() {
  return (
    <GitlabPreview
      idPrefix="gitlab-preview-merge-requests"
      previewSection="merge-requests"
      itemsLabel="merge requests"
      emptyStateMessage="No merge requests found for the selected filters."
      loadErrorMessage="Failed to load GitLab merge requests."
      exportTable="gitlabmergerequest"
      exportFileNamePrefix="gitlab-merge-requests-preview"
      dateFilterField="created_at"
    />
  );
}

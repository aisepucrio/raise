import { GitlabPreview } from "./GitlabPreview";

export default function GitlabPreviewMetadata() {
  return (
    <GitlabPreview
      idPrefix="gitlab-preview-metadata"
      previewSection="metadata"
      itemsLabel="projects"
      emptyStateMessage="No GitLab metadata found for the selected filters."
      loadErrorMessage="Failed to load GitLab metadata."
      exportTable="gitlabmetadata"
      exportFileNamePrefix="gitlab-metadata-preview"
      dateFilterField="created_at"
    />
  );
}

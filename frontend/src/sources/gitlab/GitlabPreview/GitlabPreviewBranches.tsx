import { GitlabPreview } from "./GitlabPreview";

export default function GitlabPreviewBranches() {
  return (
    <GitlabPreview
      idPrefix="gitlab-preview-branches"
      previewSection="branches"
      itemsLabel="branches"
      emptyStateMessage="No branches found for the selected filters."
      loadErrorMessage="Failed to load GitLab branches."
      exportTable="gitlabbranch"
      exportFileNamePrefix="gitlab-branches-preview"
      showDateFilters={false}
    />
  );
}

import { GithubPreview } from "./GithubPreview";

export default function GithubPreviewPullRequests() {
  return (
    <GithubPreview
      idPrefix="github-preview-pull-requests"
      previewSection="pull-requests"
      itemsLabel="pull requests"
      emptyStateMessage="No pull requests found for the selected filters."
      loadErrorMessage="Failed to load GitHub pull requests."
      exportTable="githubissuepullrequest"
      exportDataType="pull_request"
      exportFileNamePrefix="github-pull-requests-preview"
      dateFilterField="created_at"
    />
  );
}

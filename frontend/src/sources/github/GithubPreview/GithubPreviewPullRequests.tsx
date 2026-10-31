import { GithubPreview } from "./GithubPreview";

export default function GithubPreviewPullRequests() {
  return (
    <GithubPreview
      idPrefix="github-preview-pull-requests"
      platform="github"
      dataset="pull-requests"
      itemsLabel="pull requests"
      emptyStateMessage="No pull requests found for the selected filters."
      loadErrorMessage="Failed to load GitHub pull requests."
    />
  );
}

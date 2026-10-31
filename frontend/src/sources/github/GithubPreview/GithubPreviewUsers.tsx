import { GithubPreview } from "./GithubPreview";

export default function GithubPreviewUsers() {
  return (
    <GithubPreview
      idPrefix="github-preview-users"
      platform="github"
      dataset="users"
      itemsLabel="users"
      emptyStateMessage="No users found for the selected filters."
      loadErrorMessage="Failed to load GitHub users."
    />
  );
}

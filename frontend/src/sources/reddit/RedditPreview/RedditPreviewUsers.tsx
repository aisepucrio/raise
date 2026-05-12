import { RedditPreview } from "./RedditPreview";

export function RedditPreviewUsers() {
  return (
    <RedditPreview
      idPrefix="reddit-users-preview"
      previewSection="users"
      itemsLabel="users"
      emptyStateMessage="No Reddit users found."
      loadErrorMessage="Failed to load Reddit users."
      exportTable="reddit_users"
      exportFileNamePrefix="reddit-users"
    />
  );
}
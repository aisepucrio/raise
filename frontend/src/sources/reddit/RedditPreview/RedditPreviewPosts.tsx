import { RedditPreview } from "./RedditPreview";

export function RedditPreviewPosts() {
  return (
    <RedditPreview
      idPrefix="reddit-posts-preview"
      previewSection="posts"
      itemsLabel="posts"
      emptyStateMessage="No Reddit posts found."
      loadErrorMessage="Failed to load Reddit posts."
      exportTable="reddit_posts"
      exportFileNamePrefix="reddit-posts"
    />
  );
}
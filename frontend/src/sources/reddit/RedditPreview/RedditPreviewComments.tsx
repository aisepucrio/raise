import { RedditPreview } from "./RedditPreview";

export function RedditPreviewComments() {
  return (
    <RedditPreview
      idPrefix="reddit-comments-preview"
      previewSection="comments"
      itemsLabel="comments"
      emptyStateMessage="No Reddit comments found."
      loadErrorMessage="Failed to load Reddit comments."
      exportTable="reddit_comments"
      exportFileNamePrefix="reddit-comments"
    />
  );
}
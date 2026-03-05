import { JiraPreview } from "./JiraPreview";

export default function JiraPreviewComments() {
  return (
    <JiraPreview
      idPrefix="jira-preview-comments"
      previewSection="comments"
      itemsLabel="comments"
      emptyStateMessage="No comments found for the selected filters."
      loadErrorMessage="Failed to load Jira comments."
      exportFileNamePrefix="jira-comments-preview"
      dateFilterField="created"
    />
  );
}

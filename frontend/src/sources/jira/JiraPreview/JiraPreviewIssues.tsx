import { JiraPreview } from "./JiraPreview";

export default function JiraPreviewIssues() {
  return (
    <JiraPreview
      idPrefix="jira-preview-issues"
      previewSection="issues"
      itemsLabel="issues"
      emptyStateMessage="No issues found for the selected filters."
      loadErrorMessage="Failed to load Jira issues."
      exportFileNamePrefix="jira-issues-preview"
      dateFilterField="created"
    />
  );
}

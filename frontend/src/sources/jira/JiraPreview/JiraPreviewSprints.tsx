import { JiraPreview } from "./JiraPreview";

export default function JiraPreviewSprints() {
  return (
    <JiraPreview
      idPrefix="jira-preview-sprints"
      previewSection="sprints"
      itemsLabel="sprints"
      emptyStateMessage="No sprints found for the selected filters."
      loadErrorMessage="Failed to load Jira sprints."
      exportFileNamePrefix="jira-sprints-preview"
      dateFilterField="sprint"
    />
  );
}

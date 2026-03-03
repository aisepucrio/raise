import { JiraPreview } from "./JiraPreview";

export default function JiraPreviewUsers() {
  return (
    <JiraPreview
      idPrefix="jira-preview-users"
      previewSection="users"
      itemsLabel="users"
      emptyStateMessage="No users found for the selected filters."
      loadErrorMessage="Failed to load Jira users."
      exportFileNamePrefix="jira-users-preview"
      showDateFilters={false}
    />
  );
}

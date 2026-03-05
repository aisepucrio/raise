import { GithubPreview } from "./GithubPreview";

export default function GithubPreviewIssues() {
  return (
    <GithubPreview
      idPrefix="github-preview-issues"
      previewSection="issues"
      itemsLabel="issues"
      emptyStateMessage="No issues found for the selected filters."
      loadErrorMessage="Failed to load GitHub issues."
      exportTable="githubissuepullrequest"
      exportDataType="issue"
      exportFileNamePrefix="github-issues-preview"
      dateFilterField="created_at"
    />
  );
}

import { GithubPreview } from "./GithubPreview";

export default function GithubPreviewIssues() {
  return (
    <GithubPreview
      idPrefix="github-preview-issues"
      platform="github"
      dataset="issues"
      itemsLabel="issues"
      emptyStateMessage="No issues found for the selected filters."
      loadErrorMessage="Failed to load GitHub issues."
    />
  );
}

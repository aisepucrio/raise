import { StackoverflowPreview } from "./StackoverflowPreview";

export default function StackoverflowPreviewQuestions() {
  return (
    <StackoverflowPreview
      idPrefix="stackoverflow-preview-questions"
      previewSection="questions"
      itemsLabel="questions"
      emptyStateMessage="No questions found for the selected filters."
      loadErrorMessage="Failed to load Stack Overflow questions."
      exportFileNamePrefix="stackoverflow-questions-preview"
      showDateFilters
    />
  );
}

import {
  CodePreviewModal,
  type CodePreviewModalProps,
} from "@/components/code-preview-modal";

export type PreviewCellModalProps = {
  open: boolean;
  onClose: () => void;
  value: unknown;
  dialogLabel?: CodePreviewModalProps["dialogLabel"];
};

// Modal standard for inspection of the value complete of the cell.
export function PreviewCellModal({
  open,
  onClose,
  value,
  dialogLabel,
}: PreviewCellModalProps) {
  return (
    <CodePreviewModal
      open={open}
      onClose={onClose}
      value={value}
      dialogLabel={dialogLabel}
    />
  );
}

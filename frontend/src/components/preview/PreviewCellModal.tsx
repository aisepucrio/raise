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

// Modal padrão para inspeção do valor completo da célula.
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

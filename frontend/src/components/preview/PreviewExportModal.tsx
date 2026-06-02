import { Button } from "@/components/button";
import { ModalShell } from "../modal-shell/modalShell";

export type ExportFormat = "json" | "csv";

type ExportFormatModalProps = {
  open: boolean;
  selectedFormat: ExportFormat;
  onChangeFormat: (format: ExportFormat) => void;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
};

export function PreviewExportModal({
  open,
  selectedFormat,
  onChangeFormat,
  onClose,
  onConfirm,
  isPending = false,
}: ExportFormatModalProps) {
  if (!open) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Export format">
      <div className="space-y-4">
        {/* Opções de Formato */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-(--color-secondary) cursor-pointer">
            <input
              type="radio"
              name="export-format"
              value="json"
              checked={selectedFormat === "json"}
              onChange={() => onChangeFormat("json")}
              className="accent-(--color-secondary)"
            />
            JSON
          </label>

          <label className="flex items-center gap-2 text-sm text-(--color-secondary) cursor-pointer">
            <input
              type="radio"
              name="export-format"
              value="csv"
              checked={selectedFormat === "csv"}
              onChange={() => onChangeFormat("csv")}
              className="accent-(--color-secondary)"
            />
            CSV
          </label>
        </div>

        {/* Ações / Botões do Rodapé */}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button
            text="Cancel"
            onClick={onClose}
            className="min-w-40 px-4"
            fullWidth={false}
          />

          <Button
            text={isPending ? "Exporting..." : "Confirm"}
            onClick={onConfirm}
            disabled={isPending}
            className="min-w-40 px-4"
            fullWidth={false}
          />
        </div>
      </div>
    </ModalShell>
  );
}
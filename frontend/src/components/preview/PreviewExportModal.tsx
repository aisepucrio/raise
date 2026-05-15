import { Button } from "@/components/button";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          Export format
        </h2>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={selectedFormat === "json"}
              onChange={() => onChangeFormat("json")}
            />
            JSON
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={selectedFormat === "csv"}
              onChange={() => onChangeFormat("csv")}
            />
            CSV
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-1">
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
    </div>
  );
}
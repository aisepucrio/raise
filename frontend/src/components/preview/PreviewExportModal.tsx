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
  // When given, the dialog says what the export contains: the number of
  // matching rows and the filters applied (e.g. "Search: fix").
  rowCount?: number;
  appliedFilters?: string[];
};

export function PreviewExportModal({
  open,
  selectedFormat,
  onChangeFormat,
  onClose,
  onConfirm,
  isPending = false,
  rowCount,
  appliedFilters,
}: ExportFormatModalProps) {
  if (!open) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Export format">
      <div className="space-y-4">
        {appliedFilters ? (
          <div className="space-y-2 rounded-lg border border-(--color-secondary-soft) p-3 text-sm text-(--color-secondary)">
            <p>
              {rowCount === undefined
                ? "Exports every matching row"
                : `Exports all ${rowCount.toLocaleString("en-US")} matching row${rowCount === 1 ? "" : "s"}`}
              {appliedFilters.length > 0
                ? ", with the current filters:"
                : ". No filters are applied."}
            </p>
            {appliedFilters.length > 0 ? (
              <ul className="list-disc space-y-0.5 pl-5">
                {appliedFilters.map((filter) => (
                  <li key={filter}>{filter}</li>
                ))}
              </ul>
            ) : null}
            <p className="text-xs text-(--color-secondary-muted)">
              Every column is exported, including hidden ones.
            </p>
          </div>
        ) : null}

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
        <div className="flex  justify-between gap-2 pt-2">
          <Button text="Cancel" onClick={onClose} className="w-[48%]  px-4" />

          <Button
            text={isPending ? "Exporting..." : "Confirm"}
            onClick={onConfirm}
            disabled={isPending}
            className="w-[48%] px-4"
          />
        </div>
      </div>
    </ModalShell>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  duotoneDark,
  duotoneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import { toast } from "@/components/toast";
import { useAppTheme } from "@/lib/theme-context";

export type CodePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  value: unknown;
  dialogLabel?: string;
};

// Converte o valor recebido para string segura e legível no bloco de código.
function toCodePreviewString(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function CodePreviewModal({
  open,
  onClose,
  value,
  dialogLabel = "Cell content preview",
}: CodePreviewModalProps) {
  const { theme } = useAppTheme();
  const [copied, setCopied] = useState(false);

  // Se o conteúdo for JSON válido, aplica pretty-print para melhorar leitura.
  const codeString = useMemo(() => {
    const rawString = toCodePreviewString(value);
    if (!rawString) return "";

    try {
      const parsed = JSON.parse(rawString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawString;
    }
  }, [value]);

  // Feedback visual temporário do botão de cópia.
  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  // Fecha o modal no ESC para manter consistência com outros overlays da UI.
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const syntaxTheme = theme === "dark" ? duotoneDark : duotoneLight;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={dialogLabel}
        className="w-full max-w-[min(1000px,96vw)] rounded-xl border-2 border-(--color-secondary-soft) bg-(--color-primary) p-4 shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-end gap-2">
          <button
            type="button"
            aria-label="Copy content"
            title={copied ? "Copied" : "Copy"}
            className="inline-flex size-8 items-center justify-center rounded-md border border-(--color-secondary-soft) text-(--color-secondary) hover:bg-(--color-secondary-subtle)"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(codeString);
                setCopied(true);
              } catch {
                toast.error(undefined, {
                  description: "Failed to copy to clipboard.",
                });
              }
            }}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex size-8 items-center justify-center rounded-md border border-(--color-secondary-soft) text-(--color-secondary) hover:bg-(--color-secondary-subtle)"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto rounded-md border border-(--color-secondary-soft)">
          <SyntaxHighlighter
            language="json"
            style={syntaxTheme}
            customStyle={{
              margin: 0,
              background: "transparent",
              fontSize: "0.82rem",
            }}
            wrapLongLines
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}

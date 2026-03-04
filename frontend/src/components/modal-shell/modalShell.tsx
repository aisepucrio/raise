import { type ReactNode, useEffect, useEffectEvent, useId } from "react";
import { X } from "lucide-react";

export type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  initialFocusRef?: { current: HTMLElement | null };
  children: ReactNode;
};

export function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  initialFocusRef,
  children,
}: ModalShellProps) {
  const titleId = useId();
  const onCloseEvent = useEffectEvent(onClose);

  // Foca o elemento inicial quando o modal é aberto e adiciona um listener para fechar o modal com a tecla Escape.
  useEffect(() => {
    if (!open) return;

    const timeoutId = window.setTimeout(() => {
      initialFocusRef?.current?.focus();
    }, 0);

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseEvent();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl border-2 border-(--color-secondary-soft) bg-(--color-primary) p-4 shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2
              id={titleId}
              className="text-base font-semibold text-(--color-secondary)"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="text-sm text-(--color-secondary-muted)">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex size-8 items-center justify-center rounded-md border border-(--color-secondary-soft) text-(--color-secondary) hover:bg-(--color-secondary-subtle)"
          >
            <X className="size-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

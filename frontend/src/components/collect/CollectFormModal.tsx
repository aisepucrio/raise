import type { FormEvent, ReactNode } from "react";

import { Button } from "@/components/button";
import { ModalShell, type ModalShellProps } from "@/components/modal-shell";

export type CollectFormModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  initialFocusRef?: ModalShellProps["initialFocusRef"];
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  children: ReactNode;
};

// base compartilhada para modais de inclusão em telas de collect.
export function CollectFormModal({
  open,
  onClose,
  title,
  subtitle,
  initialFocusRef,
  onConfirm,
  confirmText = "Add",
  cancelText = "Cancel",
  children,
}: CollectFormModalProps) {
  // enter em qualquer input dispara a confirmação.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onConfirm();
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      initialFocusRef={initialFocusRef}
    >
      <form onSubmit={handleSubmit}>
        {children}

        {/* ações padrão do modal */}
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            fullWidth={false}
            variant="selectable"
            selected={false}
            text={cancelText}
            onClick={onClose}
          />
          <Button type="submit" size="sm" fullWidth={false} text={confirmText} />
        </div>
      </form>
    </ModalShell>
  );
}

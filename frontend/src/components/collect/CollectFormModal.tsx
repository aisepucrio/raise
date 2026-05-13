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

// Shared base for add-item modals on collect screens.
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
  // Pressing Enter in any input triggers confirmation.
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

        {/* Standard modal actions. */}
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

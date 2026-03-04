import type { ReactNode } from "react";

export type PreviewWrapperProps = {
  children: ReactNode;
};

// Wrapper base compartilhado das telas de preview.
export function PreviewWrapper({ children }: PreviewWrapperProps) {
  return (
    <section className="flex h-full min-h-0 flex-col gap-4 rounded-xl bg-(--color-primary) p-4">
      {children}
    </section>
  );
}

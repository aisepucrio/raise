import type { ReactNode } from "react";

export type PreviewWrapperProps = {
  children: ReactNode;
};

// Wrapper base shared of the screens of preview.
export function PreviewWrapper({ children }: PreviewWrapperProps) {
  return (
    <section className="flex h-full min-h-0 flex-col gap-4 rounded-xl bg-(--color-primary) p-4">
      {children}
    </section>
  );
}

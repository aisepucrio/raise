import type { ReactNode } from "react";

export type CollectWrapperProps = {
  children: ReactNode;
};

// wrapper visual base shared between the screens of collect.
export function CollectWrapper({ children }: CollectWrapperProps) {
  return (
    <section className="w-full">
      <section className="w-full xl:w-[70%] xl:min-w-180 xl:max-w-full space-y-4 rounded-xl border-2 border-(--color-secondary-soft) bg-(--color-primary) p-4 xl:mx-auto">
        {children}
      </section>
    </section>
  );
}

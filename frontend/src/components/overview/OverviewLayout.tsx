import type { ReactNode } from "react";

type OverviewLayoutProps = {
  filters: ReactNode;
  chart: ReactNode;
  stats: ReactNode;
};

// Estrutura principal de overview: conteúdo central + sidebar de métricas.
export function OverviewLayout({ filters, chart, stats }: OverviewLayoutProps) {
  return (
    <section className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,4fr)_minmax(0,1fr)]">
      <section className="flex min-h-168 min-w-0 flex-col rounded-xl border-2 border-(--color-secondary-soft) bg-(--color-primary) xl:h-full xl:max-h-full xl:min-h-0">
        {filters}
        {chart}
      </section>

      <aside className="flex min-h-168 min-w-0 flex-col rounded-xl border-2 border-(--color-secondary-soft) bg-(--color-primary) xl:h-full xl:max-h-full xl:min-h-0">
        {stats}
      </aside>
    </section>
  );
}

export type { OverviewLayoutProps };

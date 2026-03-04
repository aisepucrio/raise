import { InfoBoxGrid, type InfoBoxGridItem } from "@/components/info-box";
import { getOverviewSidebarGridRowsStyle } from "@/sources/shared/OverviewShared";

type OverviewStatsSectionProps = {
  items: InfoBoxGridItem[];
};

// Sidebar com cards de métricas distribuídos pela altura disponível.
export function OverviewStatsSection({ items }: OverviewStatsSectionProps) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden p-4">
      <InfoBoxGrid
        items={items}
        style={getOverviewSidebarGridRowsStyle(items.length)}
        className="h-full min-h-0 grid-cols-1 p-0 sm:grid-cols-1 xl:grid-cols-1 [&_article]:min-h-0"
      />
    </div>
  );
}

export type { OverviewStatsSectionProps };

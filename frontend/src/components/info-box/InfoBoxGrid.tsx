import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

import { InfoBox } from "./InfoBox";
import type { InfoBoxColor, InfoBoxProps } from "./InfoBox";

type InfoBoxGridItem = Pick<InfoBoxProps, "title" | "number"> & {
  color?: InfoBoxColor;
};

type InfoBoxGridProps = {
  items: InfoBoxGridItem[];
  className?: string;
  style?: CSSProperties;
};

function InfoBoxGrid({ items, className, style }: InfoBoxGridProps) {
  return (
    <div
      data-slot="info-box-grid"
      style={style}
      className={cn(
        "grid auto-rows-fr grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {items.map((item, index) => (
        <InfoBox
          key={`${item.title}-${index}`}
          title={item.title}
          number={item.number}
          // Alterna as cores por índice para manter o padrão zebra no grid.
          color={item.color ?? (index % 2 === 0 ? "primary" : "secondary")}
        />
      ))}
    </div>
  );
}

export { InfoBoxGrid };
export type { InfoBoxGridItem, InfoBoxGridProps };

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

import { InfoBox } from "./InfoBox";
import type { InfoBoxColor, InfoBoxProps } from "./InfoBox";

export type InfoBoxGridItem = Pick<InfoBoxProps, "title" | "number"> & {
  color?: InfoBoxColor;
};

export type InfoBoxGridProps = {
  items: InfoBoxGridItem[];
  className?: string;
  style?: CSSProperties;
};

export function InfoBoxGrid({ items, className, style }: InfoBoxGridProps) {
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
          // Alternates colors by index to keep the standard zebra pattern in the grid.
          color={item.color ?? (index % 2 === 0 ? "primary" : "secondary")}
        />
      ))}
    </div>
  );
}

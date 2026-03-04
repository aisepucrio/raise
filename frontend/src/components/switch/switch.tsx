import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export function Switch({
  className,
  size = "default",
  variant = "default",
  trackWidth,
  style,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
  variant?: "default" | "theme-toggle";
  trackWidth?: number | string;
}) {
  // Aceita px (`number`) e valores fluidos (`string`, ex.: `100%`).
  const resolvedTrackWidth =
    trackWidth === undefined
      ? undefined
      : typeof trackWidth === "number"
        ? `${trackWidth}px`
        : trackWidth;

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      data-variant={variant}
      style={
        resolvedTrackWidth !== undefined
          ? ({
              ...style,
              width: resolvedTrackWidth,
            } as React.CSSProperties)
          : style
      }
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border-[3px] border-(--color-secondary) shadow-xs outline-none transition-all [--switch-border-width:3px] data-[size=default]:[--switch-thumb-size:16px] data-[size=default]:h-6 data-[size=default]:w-8 data-[size=sm]:[--switch-thumb-size:12px] data-[size=sm]:h-3.5 data-[size=sm]:w-6 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "theme-toggle"
          ? "data-[state=checked]:bg-(--color-secondary) data-[state=unchecked]:bg-(--color-secondary)"
          : "data-[state=checked]:bg-(--color-secondary) data-[state=unchecked]:bg-(--color-primary)",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none absolute top-1/2 left-(--switch-border-width) block -translate-y-1/2 rounded-full ring-0 shadow-xs transition-all group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-[state=checked]:left-[calc(100%-var(--switch-border-width)-var(--switch-thumb-size))]",
          variant === "theme-toggle"
            ? "data-[state=checked]:bg-(--color-primary) data-[state=unchecked]:bg-(--color-primary)"
            : "data-[state=checked]:bg-(--color-primary) data-[state=unchecked]:bg-(--color-secondary)",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

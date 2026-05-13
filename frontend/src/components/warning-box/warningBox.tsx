import type { CSSProperties, ComponentType } from "react";
import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type WarningBoxVariant =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "error";
export type WarningBoxWidth = "full" | "auto";

export type WarningBoxProps = {
  text: string;
  variant?: WarningBoxVariant;
  width?: WarningBoxWidth;
  className?: string;
};

// Fixed styles by variant, aligned with tokens used in toast.
const VARIANT_STYLE: Record<WarningBoxVariant, CSSProperties> = {
  default: {
    backgroundColor: "var(--color-primary)",
    borderColor: "var(--color-secondary-soft)",
    color: "var(--color-secondary)",
  },
  success: {
    backgroundColor:
      "color-mix(in srgb, var(--color-teal) 10%, var(--color-primary))",
    borderColor:
      "color-mix(in srgb, var(--color-teal) 42%, var(--color-secondary-soft))",
    color: "var(--color-teal)",
  },
  info: {
    backgroundColor:
      "color-mix(in srgb, var(--color-indigo) 10%, var(--color-primary))",
    borderColor:
      "color-mix(in srgb, var(--color-indigo) 42%, var(--color-secondary-soft))",
    color: "var(--color-indigo)",
  },
  warning: {
    backgroundColor:
      "color-mix(in srgb, var(--color-amber) 12%, var(--color-primary))",
    borderColor:
      "color-mix(in srgb, var(--color-amber) 42%, var(--color-secondary-soft))",
    color: "var(--color-amber)",
  },
  error: {
    backgroundColor:
      "color-mix(in srgb, var(--color-rose) 10%, var(--color-primary))",
    borderColor:
      "color-mix(in srgb, var(--color-rose) 42%, var(--color-secondary-soft))",
    color: "var(--color-rose)",
  },
};

// Fixed icon by variant, without close action.
const VARIANT_ICON = {
  default: InfoIcon,
  success: CircleCheckIcon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
  error: OctagonXIcon,
} satisfies Record<WarningBoxVariant, ComponentType<{ className?: string }>>;

export function WarningBox({
  text,
  variant = "warning",
  width = "full",
  className,
}: WarningBoxProps) {
  const Icon = VARIANT_ICON[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3 text-sm",
        width === "full" ? "w-full" : "w-fit max-w-full",
        className,
      )}
      style={VARIANT_STYLE[variant]}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p>{text}</p>
    </div>
  );
}

import type { CSSProperties } from "react";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useAppTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const defaultIcons: NonNullable<ToasterProps["icons"]> = {
  success: <CircleCheckIcon className="size-4" />,
  info: <InfoIcon className="size-4" />,
  warning: <TriangleAlertIcon className="size-4" />,
  error: <OctagonXIcon className="size-4" />,
  loading: <Loader2Icon className="size-4 animate-spin" />,
};

const defaultToastStyle = {
  "--normal-bg": "var(--color-primary)",
  "--normal-bg-hover":
    "color-mix(in srgb, var(--color-secondary) 8%, var(--color-primary))",
  "--normal-text": "var(--color-secondary)",
  "--normal-border": "var(--color-secondary-soft)",
  "--normal-border-hover": "var(--color-secondary-soft)",
  "--success-bg": "color-mix(in srgb, var(--color-teal) 10%, var(--color-primary))",
  "--success-border":
    "color-mix(in srgb, var(--color-teal) 42%, var(--color-secondary-soft))",
  "--success-text": "var(--color-teal)",
  "--info-bg": "color-mix(in srgb, var(--color-indigo) 10%, var(--color-primary))",
  "--info-border":
    "color-mix(in srgb, var(--color-indigo) 42%, var(--color-secondary-soft))",
  "--info-text": "var(--color-indigo)",
  "--warning-bg": "color-mix(in srgb, var(--color-amber) 12%, var(--color-primary))",
  "--warning-border":
    "color-mix(in srgb, var(--color-amber) 42%, var(--color-secondary-soft))",
  "--warning-text": "var(--color-amber)",
  "--error-bg": "color-mix(in srgb, var(--color-rose) 10%, var(--color-primary))",
  "--error-border":
    "color-mix(in srgb, var(--color-rose) 42%, var(--color-secondary-soft))",
  "--error-text": "var(--color-rose)",
  "--border-radius": "var(--radius, 0.75rem)",
} as CSSProperties;

function Toast({
  className,
  icons,
  style,
  theme: themeProp,
  ...props
}: ToasterProps) {
  const { theme } = useAppTheme();

  return (
    <Sonner
      {...props}
      theme={themeProp ?? theme}
      className={cn("toaster group", className)}
      icons={{ ...defaultIcons, ...icons }}
      style={{
        ...defaultToastStyle,
        ...(style ?? {}),
      }}
    />
  );
}

export { Toast };
export type { ToasterProps as ToastProps };

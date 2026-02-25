import { type CSSProperties } from "react";
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
  "--normal-bg": "var(--color-toast-bg)",
  "--normal-bg-hover": "var(--color-toast-bg-hover)",
  "--normal-text": "var(--color-toast-text)",
  "--normal-border": "var(--color-toast-border)",
  "--normal-border-hover": "var(--color-toast-border-hover)",
  "--success-bg": "var(--color-toast-success-bg)",
  "--success-border": "var(--color-toast-success-border)",
  "--success-text": "var(--color-toast-success-text)",
  "--info-bg": "var(--color-toast-info-bg)",
  "--info-border": "var(--color-toast-info-border)",
  "--info-text": "var(--color-toast-info-text)",
  "--warning-bg": "var(--color-toast-warning-bg)",
  "--warning-border": "var(--color-toast-warning-border)",
  "--warning-text": "var(--color-toast-warning-text)",
  "--error-bg": "var(--color-toast-error-bg)",
  "--error-border": "var(--color-toast-error-border)",
  "--error-text": "var(--color-toast-error-text)",
  "--border-radius": "var(--radius, 0.75rem)",
} as React.CSSProperties;

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

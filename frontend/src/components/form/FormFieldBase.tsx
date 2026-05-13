import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FormFieldLabelPosition = "top" | "left";

type FormFieldBaseProps = {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  labelPosition?: FormFieldLabelPosition;
  children: ReactNode;
};

export default function FormFieldBase({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  labelPosition = "top",
  children,
}: FormFieldBaseProps) {
  const isInlineLabel = labelPosition === "left" && Boolean(label);

  return (
    <div
      className={cn(
        "grid gap-1.5",
        isInlineLabel && "grid-cols-[auto_auto] items-center gap-x-3 gap-y-1",
        className,
      )}
    >
      {label ? (
        <label
          className={cn(
            "inline-flex items-center gap-1 text-sm font-semibold text-(--color-secondary-strong)",
            isInlineLabel && "whitespace-nowrap",
          )}
          htmlFor={htmlFor}
        >
          <span>{label}</span>
          {required ? (
            <span className="text-(--color-red)" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className={cn(isInlineLabel && "min-w-0")}>{children}</div>

      {error ? (
        <p
          className={cn(
            "m-0 text-[0.82rem] text-(--color-red)",
            isInlineLabel && "col-start-2",
          )}
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          className={cn(
            "m-0 text-[0.82rem] text-(--color-secondary-muted)",
            isInlineLabel && "col-start-2",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

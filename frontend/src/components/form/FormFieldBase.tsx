import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const formControlBaseClassName =
  "w-full min-w-0 min-h-11 box-border rounded-md !border-0 shadow-none px-3.5 py-2.5 [font:inherit] leading-[1.35] [color-scheme:light_dark] bg-[color:var(--color-form-bg)] text-[color:var(--color-form-text)] placeholder:text-[color:var(--color-form-placeholder)] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:[box-shadow:none] focus-visible:[box-shadow:none] disabled:cursor-not-allowed disabled:bg-[color:var(--color-form-disabled-bg)] disabled:text-[color:var(--color-form-disabled-text)] disabled:placeholder:text-[color:var(--color-form-disabled-text)]";

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
            "inline-flex items-center gap-1 text-sm font-semibold text-(--color-form-label)",
            isInlineLabel && "whitespace-nowrap",
          )}
          htmlFor={htmlFor}
        >
          <span>{label}</span>
          {required ? (
            <span className="text-(--color-form-error)" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className={cn(isInlineLabel && "min-w-0")}>{children}</div>

      {error ? (
        <p
          className={cn(
            "m-0 text-[0.82rem] text-(--color-form-error)",
            isInlineLabel && "col-start-2",
          )}
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          className={cn(
            "m-0 text-[0.82rem] text-(--color-form-hint)",
            isInlineLabel && "col-start-2",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

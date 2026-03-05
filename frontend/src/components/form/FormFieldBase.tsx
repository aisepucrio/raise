import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FormControlVariant = "outlined" | "filled";

const formControlSharedClassName =
  "w-full min-w-0 min-h-11 box-border rounded-md shadow-none px-3.5 py-2.5 [font:inherit] leading-[1.35] outline-none transition-colors focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:[box-shadow:none] focus-visible:[box-shadow:none] disabled:cursor-not-allowed";

const formControlOutlinedClassName =
  "border border-(--color-secondary-soft) bg-(--color-primary) text-(--color-secondary) placeholder:text-(--color-secondary-muted) focus:border-(--color-secondary) focus-visible:border-(--color-secondary) disabled:border-(--color-secondary-subtle) disabled:bg-(--color-secondary-subtle) disabled:text-(--color-secondary-muted) disabled:placeholder:text-(--color-secondary-muted)";

const formControlFilledClassName =
  "!border-0 bg-[color:var(--color-secondary)] text-[color:var(--color-secondary-inverse)] placeholder:text-[color:var(--color-secondary-inverse-muted)] disabled:bg-[color:var(--color-secondary-muted)] disabled:text-[color:var(--color-secondary-inverse-muted)] disabled:placeholder:text-[color:var(--color-secondary-inverse-muted)]";

export function getFormControlClassName(variant: FormControlVariant = "outlined") {
  return cn(
    formControlSharedClassName,
    variant === "filled" ? formControlFilledClassName : formControlOutlinedClassName,
  );
}

export const formControlBaseClassName = getFormControlClassName();

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

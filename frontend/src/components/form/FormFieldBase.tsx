import type { ReactNode } from "react";

type FormFieldBaseProps = {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

export default function FormFieldBase({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FormFieldBaseProps) {
  return (
    <div className={["grid gap-1.5", className].filter(Boolean).join(" ")}>
      {label ? (
        <label
          className="inline-flex items-center gap-1 text-sm font-semibold text-(--color-form-label)"
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

      {children}

      {error ? (
        <p
          className="m-0 text-[0.82rem] text-(--color-form-error)"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="m-0 text-[0.82rem] text-(--color-form-hint)">{hint}</p>
      ) : null}
    </div>
  );
}

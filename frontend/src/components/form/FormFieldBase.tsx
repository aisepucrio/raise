import type { ReactNode } from "react";
import {
  formFieldErrorClassName,
  formFieldHintClassName,
  formFieldLabelClassName,
  formFieldRequiredMarkClassName,
  formFieldWrapperClassName,
} from "./formStyles";

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
    <div
      className={[formFieldWrapperClassName, className].filter(Boolean).join(" ")}
    >
      {label ? (
        <label className={formFieldLabelClassName} htmlFor={htmlFor}>
          <span>{label}</span>
          {required ? (
            <span className={formFieldRequiredMarkClassName} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {error ? (
        <p className={formFieldErrorClassName} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={formFieldHintClassName}>{hint}</p>
      ) : null}
    </div>
  );
}

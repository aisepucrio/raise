import type { ReactNode, SelectHTMLAttributes } from "react";
import FormFieldBase from "./FormFieldBase";
import { formControlClassName } from "./formControlClassName";

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
  children: ReactNode;
};

export default function FormSelect({
  id,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  className,
  children,
  ...props
}: FormSelectProps) {
  return (
    <FormFieldBase
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <select
        id={id}
        required={required}
        className={[formControlClassName, "pr-9", className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </select>
    </FormFieldBase>
  );
}

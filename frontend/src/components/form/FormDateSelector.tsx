import type { InputHTMLAttributes } from "react";
import FormFieldBase from "./FormFieldBase";
import { formControlBaseClassName } from "./formStyles";

type NativeDateProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

type FormDateSelectorProps = NativeDateProps & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export default function FormDateSelector({
  id,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  className,
  ...props
}: FormDateSelectorProps) {
  return (
    <FormFieldBase
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <input
        id={id}
        type="date"
        required={required}
        className={[
          formControlBaseClassName,
          "min-w-0",
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
          "[&::-webkit-calendar-picker-indicator]:[filter:var(--color-form-date-picker-indicator-filter)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    </FormFieldBase>
  );
}

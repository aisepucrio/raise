import type { InputHTMLAttributes } from "react";
import FormFieldBase from "./FormFieldBase";
import { formControlBaseClassName } from "./formStyles";

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export default function FormInput({
  id,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  className,
  type = "text",
  ...props
}: FormInputProps) {
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
        type={type}
        required={required}
        className={[formControlBaseClassName, className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    </FormFieldBase>
  );
}

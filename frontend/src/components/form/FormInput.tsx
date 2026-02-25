import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import FormFieldBase, {
  formControlBaseClassName,
  type FormFieldLabelPosition,
} from "./FormFieldBase";

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
  labelPosition?: FormFieldLabelPosition;
};

export default function FormInput({
  id,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  labelPosition = "top",
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
      labelPosition={labelPosition}
    >
      <input
        id={id}
        type={type}
        required={required}
        className={cn(
          formControlBaseClassName,
          className,
        )}
        {...props}
      />
    </FormFieldBase>
  );
}

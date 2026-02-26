import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import FormFieldBase, {
  formControlBaseClassName,
  type FormFieldLabelPosition,
} from "./FormFieldBase";

type NativeDateProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

type FormDateSelectorProps = NativeDateProps & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
  labelPosition?: FormFieldLabelPosition;
};

export default function FormDateSelector({
  id,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  labelPosition = "top",
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
      labelPosition={labelPosition}
    >
      <input
        id={id}
        type="date"
        required={required}
        className={cn(
          formControlBaseClassName,
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
          "[&::-webkit-calendar-picker-indicator]:filter-(--color-date-picker-indicator-filter)",
          className,
        )}
        {...props}
      />
    </FormFieldBase>
  );
}

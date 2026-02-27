import type { InputHTMLAttributes } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import FormFieldBase, {
  getFormControlClassName,
  type FormControlVariant,
  type FormFieldLabelPosition,
} from "./FormFieldBase";

type NativeDateProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

type FormDateSelectorProps = NativeDateProps & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
  labelPosition?: FormFieldLabelPosition;
  variant?: FormControlVariant;
};

export default function FormDateSelector({
  id,
  label,
  hint,
  error,
  required,
  disabled,
  wrapperClassName,
  labelPosition = "top",
  variant = "outlined",
  className,
  ...props
}: FormDateSelectorProps) {
  const isFilledVariant = variant === "filled";

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
      <div className="relative">
        <input
          id={id}
          type="date"
          required={required}
          disabled={disabled}
          className={cn(
            getFormControlClassName(variant),
            "relative pr-10",
            "[&::-webkit-calendar-picker-indicator]:absolute",
            "[&::-webkit-calendar-picker-indicator]:top-0",
            "[&::-webkit-calendar-picker-indicator]:right-0",
            "[&::-webkit-calendar-picker-indicator]:h-full",
            "[&::-webkit-calendar-picker-indicator]:w-10",
            "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
            "[&::-webkit-calendar-picker-indicator]:opacity-0",
            className,
          )}
          {...props}
        />

        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 right-3 flex items-center",
            disabled
              ? "text-(--color-secondary-muted)"
              : isFilledVariant
                ? "text-[color:var(--color-secondary-inverse)]"
                : "text-(--color-secondary)",
          )}
        >
          <Calendar size={16} />
        </span>
      </div>
    </FormFieldBase>
  );
}

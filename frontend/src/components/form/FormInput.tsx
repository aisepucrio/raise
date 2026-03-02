import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import FormFieldBase, {
  getFormControlClassName,
  type FormControlVariant,
  type FormFieldLabelPosition,
} from "./FormFieldBase";

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  wrapperClassName?: string;
  labelPosition?: FormFieldLabelPosition;
  variant?: FormControlVariant;
};

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(function FormInput(
  {
    id,
    label,
    hint,
    error,
    icon,
    iconPosition = "left",
    required,
    wrapperClassName,
    labelPosition = "top",
    variant = "outlined",
    className,
    type = "text",
    ...props
  },
  ref,
) {
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
          ref={ref}
          id={id}
          type={type}
          required={required}
          className={cn(
            getFormControlClassName(variant),
            icon && (iconPosition === "left" ? "pl-10" : "pr-10"),
            className,
          )}
          {...props}
        />

        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 flex items-center text-(--color-secondary-muted)",
              iconPosition === "left" ? "left-3.5" : "right-3.5",
              variant === "filled" &&
                "text-[color:var(--color-secondary-inverse-muted)]",
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </FormFieldBase>
  );
});

export default FormInput;

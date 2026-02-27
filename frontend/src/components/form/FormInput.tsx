import { forwardRef, type InputHTMLAttributes } from "react";
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
      <input
        ref={ref}
        id={id}
        type={type}
        required={required}
        className={cn(
          getFormControlClassName(variant),
          className,
        )}
        {...props}
      />
    </FormFieldBase>
  );
});

export default FormInput;

import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import type { KeyboardEvent, ReactNode, SelectHTMLAttributes } from "react";
import FormFieldBase from "./FormFieldBase";
import {
  formControlBaseClassName,
  formSelectIconClassName,
  formSelectSpecificClassName,
} from "./formStyles";

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
  const [isOpenLike, setIsOpenLike] = useState(false);
  const lastOpenPointerDownAtRef = useRef<number>(0);

  const handleKeyDown = (event: KeyboardEvent<HTMLSelectElement>) => {
    if (event.key === "Escape") {
      setIsOpenLike(false);
    }

    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "ArrowDown" ||
      event.key === "ArrowUp"
    ) {
      setIsOpenLike(true);
    }

  };

  return (
    <FormFieldBase
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <div className="relative">
        <motion.span
          className={formSelectIconClassName}
          aria-hidden="true"
          animate={{ rotate: isOpenLike ? 90 : 0 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <ChevronRight size={16} />
        </motion.span>

        <select
          id={id}
          required={required}
          onPointerDown={() => {
            lastOpenPointerDownAtRef.current = Date.now();
            setIsOpenLike(true);
          }}
          onClick={() => {
            if (Date.now() - lastOpenPointerDownAtRef.current > 150) {
              setIsOpenLike(false);
            }
          }}
          onFocus={() => {
            setIsOpenLike(true);
          }}
          onBlur={() => {
            setIsOpenLike(false);
          }}
          onChange={() => {
            setIsOpenLike(false);
          }}
          onKeyDown={handleKeyDown}
          className={[
            formControlBaseClassName,
            formSelectSpecificClassName,
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {children}
        </select>
      </div>
    </FormFieldBase>
  );
}

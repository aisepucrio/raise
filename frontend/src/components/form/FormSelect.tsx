import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import FormFieldBase, {
  type FormFieldLabelPosition,
} from "./FormFieldBase";
import {
  getFormControlClassName,
  type FormControlVariant,
} from "./formControlClassName";

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
  labelPosition?: FormFieldLabelPosition;
  variant?: FormControlVariant;
  children: ReactNode;
};

const MAX_VISIBLE_OPTIONS_ESTIMATE = 8;
const MIN_OPTION_HEIGHT_ESTIMATE = 32;
const SUPPORTS_SELECT_OPEN_PSEUDO_CLASS =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("selector(select:open)");

export default function FormSelect({
  id,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  labelPosition = "top",
  variant = "outlined",
  className,
  children,
  ...props
}: FormSelectProps) {
  const isFilledVariant = variant === "filled";
  const selectRef = useRef<HTMLSelectElement>(null);
  // UI-only flag used to animatesteste the chevron while native popup is open.
  const [isOpenLike, setIsOpenLike] = useState(false);
  const [openDirection, setOpenDirection] = useState<"up" | "down">("down");

  const closeSelectLike = useCallback(() => {
    setIsOpenLike(false);
  }, []);

  const syncOpenDirection = () => {
    const selectElement = selectRef.current;

    if (!selectElement || typeof window === "undefined") {
      setOpenDirection("down");
      return;
    }

    const selectRect = selectElement.getBoundingClientRect();
    const availableSpaceAbove = selectRect.top;
    const availableSpaceBelow = window.innerHeight - selectRect.bottom;
    // Native select does not expose popup placement, so we estimate it for viewport space.
    const visibleOptionCount =
      selectElement.size > 1
        ? selectElement.size
        : Math.min(selectElement.options.length, MAX_VISIBLE_OPTIONS_ESTIMATE);
    const estimatedDropdownHeight =
      Math.max(selectRect.height, MIN_OPTION_HEIGHT_ESTIMATE) *
      visibleOptionCount;

    if (
      availableSpaceBelow >= estimatedDropdownHeight ||
      availableSpaceBelow >= availableSpaceAbove
    ) {
      setOpenDirection("down");
      return;
    }

    setOpenDirection("up");
  };

  const openSelectLike = () => {
    syncOpenDirection();
    setIsOpenLike(true);
  };

  useEffect(() => {
    if (!isOpenLike || SUPPORTS_SELECT_OPEN_PSEUDO_CLASS) {
      return;
    }

    // Fallback for browsers without :open support.
    const handlePointerDownOutside = (event: PointerEvent) => {
      const selectElement = selectRef.current;
      const target = event.target;

      if (!selectElement || !(target instanceof Node)) {
        return;
      }

      if (!selectElement.contains(target)) {
        closeSelectLike();
      }
    };

    window.addEventListener("pointerdown", handlePointerDownOutside, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDownOutside, true);
    };
  }, [closeSelectLike, isOpenLike]);

  useEffect(() => {
    if (!isOpenLike || !SUPPORTS_SELECT_OPEN_PSEUDO_CLASS) {
      return;
    }

    let frameId = 0;

    // Native select can close without dispatching blur/change; :open keeps animatestestion in sync.
    const syncFromNativeOpenState = () => {
      const selectElement = selectRef.current;

      if (!selectElement) {
        return;
      }

      if (!selectElement.matches(":open")) {
        closeSelectLike();
        return;
      }

      frameId = window.requestAnimationFrame(syncFromNativeOpenState);
    };

    frameId = window.requestAnimationFrame(syncFromNativeOpenState);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [closeSelectLike, isOpenLike]);

  const handleKeyDown = (event: KeyboardEvent<HTMLSelectElement>) => {
    if (event.key === "Escape") {
      closeSelectLike();
    }

    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "ArrowDown" ||
      event.key === "ArrowUp"
    ) {
      openSelectLike();
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
      labelPosition={labelPosition}
    >
      <div className="relative">
        <motion.span
          className={cn(
            "pointer-events-none absolute inset-y-0 left-3 flex items-center",
            isFilledVariant
              ? "text-(--color-secondary-inverse)"
              : "text-(--color-secondary-muted)",
          )}
          aria-hidden="true"
          animate={{
            rotate: isOpenLike ? (openDirection === "up" ? -90 : 90) : 0,
          }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <ChevronRight size={16} />
        </motion.span>

        <select
          ref={selectRef}
          id={id}
          required={required}
          onPointerDown={openSelectLike}
          onBlur={closeSelectLike}
          onChange={closeSelectLike}
          onKeyDown={handleKeyDown}
          className={cn(
            getFormControlClassName(variant),
            "appearance-none pl-9 pr-3",
            className,
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    </FormFieldBase>
  );
}

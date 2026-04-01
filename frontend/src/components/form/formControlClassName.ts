import { cn } from "@/lib/utils";

export type FormControlVariant = "outlined" | "filled";

const formControlSharedClassName =
  "w-full min-w-0 min-h-11 box-border rounded-md shadow-none px-3.5 py-2.5 [font:inherit] leading-[1.35] outline-none transition-colors focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:[box-shadow:none] focus-visible:[box-shadow:none] disabled:cursor-not-allowed";

const formControlOutlinedClassName =
  "border border-(--color-secondary-soft) bg-(--color-primary) text-(--color-secondary) placeholder:text-(--color-secondary-muted) focus:border-(--color-secondary) focus-visible:border-(--color-secondary) disabled:border-(--color-secondary-subtle) disabled:bg-(--color-secondary-subtle) disabled:text-(--color-secondary-muted) disabled:placeholder:text-(--color-secondary-muted)";

const formControlFilledClassName =
  "!border-0 bg-[color:var(--color-secondary)] text-[color:var(--color-secondary-inverse)] placeholder:text-[color:var(--color-secondary-inverse-muted)] disabled:bg-[color:var(--color-secondary-muted)] disabled:text-[color:var(--color-secondary-inverse-muted)] disabled:placeholder:text-[color:var(--color-secondary-inverse-muted)]";

export function getFormControlClassName(
  variant: FormControlVariant = "outlined",
) {
  return cn(
    formControlSharedClassName,
    variant === "filled" ? formControlFilledClassName : formControlOutlinedClassName,
  );
}

export const formControlBaseClassName = getFormControlClassName();

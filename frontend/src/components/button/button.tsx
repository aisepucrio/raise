import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

// Propriedades nativas de botão permitidas na API padronizada.
type ButtonBaseProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "id"
  | "type"
  | "disabled"
  | "onClick"
  | "title"
  | "autoFocus"
  | "name"
  | "value"
  | "form"
  | "aria-label"
  | "aria-current"
> & {
  text?: string;
  icon?: ReactNode;
  iconSide?: "left" | "right";
  fullWidth?: boolean;
  className?: string;
  variant?: "default" | "selectable";
  selected?: boolean;
};

type ButtonProps =
  | (ButtonBaseProps & { text: string })
  | (ButtonBaseProps & { icon: ReactNode; "aria-label": string });

function Button({
  id,
  type = "button",
  disabled = false,
  onClick,
  title,
  autoFocus,
  name,
  value,
  form,
  className,
  text,
  icon,
  iconSide = "left",
  fullWidth = true,
  variant = "default",
  selected = false,
  "aria-label": ariaLabel,
  "aria-current": ariaCurrent,
}: ButtonProps) {
  const hasText = Boolean(text);
  const hasIcon = Boolean(icon);
  const isIconOnly = hasIcon && !hasText;
  const isSelectable = variant === "selectable";

  const iconNode = hasIcon ? (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center [&>svg]:size-4",
        isIconOnly ? "size-5" : "size-4",
      )}
    >
      {icon}
    </span>
  ) : null;

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-selected={isSelectable ? String(selected) : undefined}
      id={id}
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      autoFocus={autoFocus}
      name={name}
      value={value}
      form={form}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md shadow-none outline-none [font:inherit] text-sm font-semibold leading-[1.35] whitespace-nowrap transition-[filter,background-color,color,border-color] duration-150",
        "enabled:cursor-pointer disabled:cursor-not-allowed",
        "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-secondary-strong)",
        isIconOnly
          ? "w-11 min-h-11 px-0 py-0"
          : "min-h-11 px-3.5 py-2.5",
        fullWidth && !isIconOnly ? "w-full" : null,
        isSelectable
          ? selected
            ? "border border-(--color-secondary) bg-(--color-secondary) text-(--color-secondary-inverse) enabled:hover:bg-(--color-secondary) enabled:active:filter-none"
            : "border border-(--color-secondary) bg-transparent text-(--color-secondary) enabled:hover:bg-(--color-secondary-subtle) enabled:active:bg-(--color-secondary-subtle) enabled:active:filter-none"
          : "border-0 bg-(--color-secondary) text-(--color-secondary-inverse) enabled:hover:bg-(--color-secondary-strong) enabled:active:filter-[brightness(0.92)]",
        isSelectable
          ? "disabled:border-(--color-secondary-subtle) disabled:bg-transparent disabled:text-(--color-secondary-mid) disabled:filter-none"
          : "disabled:bg-(--color-secondary-muted) disabled:text-(--color-secondary-inverse-muted) disabled:filter-none",
        className,
      )}
    >
      {iconSide === "left" ? iconNode : null}
      {hasText ? <span>{text}</span> : null}
      {iconSide === "right" ? iconNode : null}
    </button>
  );
}

export { Button };
export type { ButtonProps };

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

// Propriedades nativas de botão (excluindo `className` e `style`)
type BasicButtonNativeProps = Pick<
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
>;

type ButtonBaseProps = BasicButtonNativeProps & {
  text?: string;
  icon?: ReactNode;
  iconSide?: "left" | "right";
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
  text,
  icon,
  iconSide = "left",
  "aria-label": ariaLabel,
}: ButtonProps) {
  const hasText = Boolean(text);
  const hasIcon = Boolean(icon);
  const isIconOnly = hasIcon && !hasText;

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
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border-0 bg-[color:var(--color-form-bg)] text-[color:var(--color-form-text)] shadow-none outline-none [font:inherit] text-sm font-semibold leading-[1.35] whitespace-nowrap transition-[filter,background-color,color] duration-150",
        "hover:[filter:brightness(0.96)] active:[filter:brightness(0.92)] disabled:cursor-not-allowed disabled:bg-[color:var(--color-form-disabled-bg)] disabled:text-[color:var(--color-form-disabled-text)] disabled:[filter:none]",
        "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-form-focus)]",
        isIconOnly ? "w-11 px-0 py-0" : "px-3.5 py-2.5",
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

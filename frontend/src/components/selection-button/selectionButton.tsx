import { useState } from "react";

import { Button } from "@/components/button";

export type SelectionButtonProps = {
  text: string;
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  size?: "default" | "sm";
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
};

export function SelectionButton({
  text,
  pressed,
  defaultPressed = false,
  onPressedChange,
  size = "default",
  disabled = false,
  fullWidth = true,
  className,
}: SelectionButtonProps) {
  const isControlled = typeof pressed === "boolean";
  const [internalPressed, setInternalPressed] = useState(defaultPressed);
  const isPressed = isControlled ? pressed : internalPressed;

  function handleClick() {
    if (disabled) return;

    const nextPressed = !isPressed;

    if (!isControlled) {
      setInternalPressed(nextPressed);
    }

    onPressedChange?.(nextPressed);
  }

  return (
    <Button
      text={text}
      variant="selectable"
      selected={isPressed}
      size={size}
      disabled={disabled}
      fullWidth={fullWidth}
      onClick={handleClick}
      className={className}
    />
  );
}

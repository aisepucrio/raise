import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { FormInput } from "@/components/form";
import { cn } from "@/lib/utils";

export type SearchBarProps = {
  id: string;
  onSearchChange: (searchTerm: string) => void;
  label?: string;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
  expandable?: boolean;
};

export function SearchBar({
  id,
  onSearchChange,
  label = "Search",
  placeholder = "Type...",
  debounceMs = 350,
  disabled = false,
  expandable = false,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const isExpanded = expandable && (isFocused || Boolean(inputValue.trim()));

  // Debounce to avoid disparo of query in entire key digitada.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onSearchChange(inputValue.trim());
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [inputValue, debounceMs, onSearchChange]);

  return (
    <div
      className={cn(
        "min-w-0",
        !expandable && "w-full",
        expandable &&
          "w-full xl:w-[15rem] xl:transition-[width] xl:duration-300 xl:ease-out motion-reduce:transition-none",
        expandable && isExpanded && "xl:w-[28rem]",
      )}
    >
      <FormInput
        id={id}
        label={label}
        placeholder={placeholder}
        icon={<Search className="size-4" />}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        wrapperClassName="min-w-0"
        disabled={disabled}
      />
    </div>
  );
}

import { Moon, Sun } from "lucide-react";
import { Switch } from "../switch/switch";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/lib/theme-context";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useAppTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="flex w-full items-center rounded-2xl px-3 py-2 max-w-50 mx-auto"
      role="group"
      aria-label="Theme switcher"
    >
      {/* Slot fixed of the icon for keep the switch centered and with width predictable. */}
      <span className="inline-flex w-8 shrink-0 justify-center">
        <Sun
          aria-hidden="true"
          className={cn(
            "size-7 text-(--color-secondary) transition-opacity",
            isDark ? "opacity-35" : "opacity-100",
          )}
        />
      </span>

      {/* area flexible: the switch occupies entire the space restante between the icons. */}
      <span className="mx-2 flex min-w-0 flex-1 items-center">
        <Switch
          checked={isDark}
          onCheckedChange={(checked) => {
            setTheme(checked ? "dark" : "light");
          }}
          variant="theme-toggle"
          // the switch occupies entire the space restante between the icons.
          trackWidth="100%"
          aria-label={isDark ? "Activate light theme" : "Activate dark theme"}
        />
      </span>

      {/* same slot fixed of the icon of the esquerda for keep symmetry visual. */}
      <span className="inline-flex w-8 shrink-0 justify-center">
        <Moon
          aria-hidden="true"
          className={cn(
            "size-7 text-(--color-secondary) transition-opacity",
            isDark ? "opacity-100" : "opacity-35",
          )}
        />
      </span>
    </div>
  );
}

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
      {/* Fixed icon slot to keep switch centered with predictable width. */}
      <span className="inline-flex w-8 shrink-0 justify-center">
        <Sun
          aria-hidden="true"
          className={cn(
            "size-7 text-(--color-secondary) transition-opacity",
            isDark ? "opacity-35" : "opacity-100",
          )}
        />
      </span>

      {/* Flexible area: switch occupies the remaining space between icons. */}
      <span className="mx-2 flex min-w-0 flex-1 items-center">
        <Switch
          checked={isDark}
          onCheckedChange={(checked) => {
            setTheme(checked ? "dark" : "light");
          }}
          variant="theme-toggle"
          // Switch occupies all remaining space between icons.
          trackWidth="100%"
          aria-label={isDark ? "Activate light theme" : "Activate dark theme"}
        />
      </span>

      {/* Same fixed icon slot on the left side to keep visual symmetry. */}
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

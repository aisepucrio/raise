import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/button";
import { useAppTheme } from "@/lib/theme-context";

// Compact light/dark toggle: one icon button showing the theme it switches to.
export default function ThemeSwitcher() {
  const { theme, setTheme } = useAppTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <Button
      size="sm"
      fullWidth={false}
      icon={isDark ? <Sun /> : <Moon />}
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    />
  );
}

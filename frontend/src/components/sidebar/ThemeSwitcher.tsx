import { Moon, Sun } from "lucide-react";
import { Switch } from "../switch/switch";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useAppTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="flex w-full items-center rounded-2xl px-3 py-2 max-w-50 mx-auto"
      role="group"
      aria-label="Alternador de tema"
    >
      {/* Slot fixo do ícone para manter o switch centralizado e com largura previsível. */}
      <span className="inline-flex w-8 shrink-0 justify-center">
        <Sun
          aria-hidden="true"
          className={cn(
            "size-7 text-(--color-app-fg) transition-opacity",
            isDark ? "opacity-35" : "opacity-100",
          )}
        />
      </span>

      {/* Área flexível: o switch ocupa todo o espaço restante entre os ícones. */}
      <span className="mx-2 flex min-w-0 flex-1 items-center">
        <Switch
          checked={isDark}
          onCheckedChange={(checked) => {
            setTheme(checked ? "dark" : "light");
          }}
          variant="theme-toggle"
          // O switch ocupa todo o espaço restante entre os ícones.
          trackWidth="100%"
          aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
        />
      </span>

      {/* Mesmo slot fixo do ícone da esquerda para manter simetria visual. */}
      <span className="inline-flex w-8 shrink-0 justify-center">
        <Moon
          aria-hidden="true"
          className={cn(
            "size-7 text-(--color-app-fg) transition-opacity",
            isDark ? "opacity-100" : "opacity-35",
          )}
        />
      </span>
    </div>
  );
}

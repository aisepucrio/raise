import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Switch } from "../switch/switch";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark";

// Aplica a escolha atual no root para que todo o app (e os utilitários `dark:`) respondam.
const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;

  // O app usa classes explícitas no root para travar o tema escolhido.
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.dataset.theme = theme;
};

// Ordem de prioridade:
// 1) classe já definida no root (escolha explícita anterior)
// 2) preferência do sistema
// 3) light como fallback seguro
const getInitialTheme = (): ThemeMode => {
  if (typeof document !== "undefined") {
    const root = document.documentElement;

    if (root.classList.contains("dark")) {
      return "dark";
    }

    if (root.classList.contains("light")) {
      return "light";
    }
  }

  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
  ) {
    // Fallback: segue a preferência do navegador/SO até o usuário trocar manualmente.
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return "light";
};

export default function ThemeSwitcher() {
  // `true` representa tema dark ativo (switch ligado).
  const [isDark, setIsDark] = useState(() => getInitialTheme() === "dark");

  useEffect(() => {
    // Sincroniza o estado visual do switch com as classes globais de tema.
    applyTheme(isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <div
      className="flex w-full items-center rounded-2xl px-3 py-2"
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
            setIsDark(checked);
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

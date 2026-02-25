import type { ReactElement } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ThemeSwitcher from "./ThemeSwitcher";

type ThemeName = "light" | "dark";

function withInitialTheme(theme: ThemeName) {
  return (Story: () => ReactElement) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;

      root.classList.remove("light", "dark");
      root.classList.add(theme);
      root.dataset.theme = theme;
    }

    return (
      <ThemeProvider>
        <aside className="w-full max-w-72 rounded-xl border border-(--color-sidebar-border) p-4">
          <div className="border-t-2 border-(--color-sidebar-border) pt-4">
            <Story />
          </div>
        </aside>
      </ThemeProvider>
    );
  };
}

const meta = {
  title: "Components/Sidebar/ThemeSwitcher",
  component: ThemeSwitcher,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Alternador de tema da sidebar. Usa o `Switch` na variante `theme-toggle`, consome `ThemeContext` e sincroniza as classes `.light`/`.dark` no `document.documentElement`.",
      },
    },
  },
  decorators: [withInitialTheme("light")],
} satisfies Meta<typeof ThemeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Exibe o componente em contexto de sidebar. O usuário pode alternar entre light/dark e o componente atualiza o tema global do app.",
      },
    },
  },
};

export const InicialLight: Story = {
  name: "Inicial (Light)",
  decorators: [withInitialTheme("light")],
  parameters: {
    docs: {
      description: {
        story:
          "Força a inicialização em light para validar layout, cores e largura fluida do switch entre os ícones.",
      },
    },
  },
};

export const InicialDark: Story = {
  name: "Inicial (Dark)",
  decorators: [withInitialTheme("dark")],
  parameters: {
    docs: {
      description: {
        story:
          "Força a inicialização em dark para conferir contraste dos ícones, track e thumb no tema escuro.",
      },
    },
  },
};

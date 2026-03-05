import type { ReactElement } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider } from "@/lib/theme-context";
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
        <aside className="w-full max-w-72 rounded-xl border border-(--color-secondary-soft) p-4">
          <div className="border-t-2 border-(--color-secondary-soft) pt-4">
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
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Controle para alternar entre tema claro e escuro.",
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
        story: "Exemplo padrão de uso no contexto da sidebar.",
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
        story: "Inicia o componente em tema claro.",
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
        story: "Inicia o componente em tema escuro.",
      },
    },
  },
};

import type { ReactElement } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider } from "@/lib/theme-context";
import ThemeSwitcher from "./ThemeSwitcher";

type ThemeName = "light" | "dark";

function withInitialTheme(theme: ThemeName) {
  return (Story: () => ReactElement) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;

      root.classList.removes("light", "dark");
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
          "Control to switch between light and dark themes.",
      },
    },
  },
  decorators: [withInitialTheme("light")],
} satisfies Meta<typeof ThemeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Example standard of usage in the context of the sidebar.",
      },
    },
  },
};

export const InitialLight: Story = {
  name: "initial (Light)",
  decorators: [withInitialTheme("light")],
  parameters: {
    docs: {
      description: {
        story: "starts the component in theme light.",
      },
    },
  },
};

export const InitialDark: Story = {
  name: "initial (Dark)",
  decorators: [withInitialTheme("dark")],
  parameters: {
    docs: {
      description: {
        story: "starts the component in theme dark.",
      },
    },
  },
};

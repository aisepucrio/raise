import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Loader } from "./loader";

const meta = {
  title: "Components/Loader",
  component: Loader,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Loader padrão para qualquer interface de carregamento, centralizado no contêiner pai, com resize simples via `clamp(...)` ",
      },
    },
  },
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => (
    <div className="h-36 rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4">
      <Loader />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Uso comum em uma área de carregamento: o loader ocupa o espaço do pai e permanece centralizado.",
      },
    },
  },
};

export const ResizePorContainer: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="h-20 rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-2">
        <Loader />
      </div>
      <div className="h-32 rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-2">
        <Loader />
      </div>
      <div className="h-52 rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-2">
        <Loader />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Mostra o resize simples com `clamp(...)` conforme o tamanho do contêiner, mantendo centralização.",
      },
    },
  },
};

export const ComparacaoLightDark: Story = {
  render: () => {
    const darkVars = {
      "--color-primary": "var(--color-slate-950)",
      "--color-primary-inverse": "var(--color-indigo-500)",
      "--color-secondary": "var(--color-indigo-500)",
      "--color-secondary-inverse": "var(--color-slate-950)",
    } as CSSProperties;

    const lightVars = {
      "--color-primary": "var(--color-slate-050)",
      "--color-primary-inverse": "var(--color-indigo-950)",
      "--color-secondary": "var(--color-indigo-950)",
      "--color-secondary-inverse": "var(--color-slate-050)",
    } as CSSProperties;

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <section
          className="h-36 rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4"
          style={darkVars}
        >
          <p className="mb-2 text-sm font-semibold text-(--color-secondary)">
            Modo escuro
          </p>
          <div className="h-[calc(100%_-_2rem)]">
            <Loader />
          </div>
        </section>

        <section
          className="h-36 rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4"
          style={lightVars}
        >
          <p className="mb-2 text-sm font-semibold text-(--color-secondary)">
            Modo claro
          </p>
          <div className="h-[calc(100%_-_2rem)]">
            <Loader />
          </div>
        </section>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Exemplo rápido para validar contraste e uso de tokens de tema em light/dark.",
      },
    },
  },
};

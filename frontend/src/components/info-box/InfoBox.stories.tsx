import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { InfoBox } from "./";

const storyWrapperClassName =
  "rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-4 text-(--color-app-fg)";

const meta = {
  title: "Components/InfoBox",
  component: InfoBox,
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: { type: "inline-radio" },
      options: ["primary", "secondary"],
    },
  },
  args: {
    title: "Jobs processados",
    number: 128,
    color: "primary",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Card simples para métricas com título e número, usando tokens de cor do tema definidos em `src/index.css`.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className={storyWrapperClassName}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InfoBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const Secundario: Story = {
  args: {
    title: "Jobs em fila",
    number: 42,
    color: "secondary",
  },
};

export const ComparacaoDeModo: Story = {
  render: () => (
    <div className="grid gap-4 xl:grid-cols-2">
      <section
        className={storyWrapperClassName}
        style={
          {
            "--color-app-bg": "#15161f",
            "--color-app-fg": "#5f81ff",
            "--color-sidebar-border": "rgba(95, 129, 255, 0.22)",
            "--theme-primary": "#15161f",
            "--theme-secondary": "#5f81ff",
            "--theme-secondary-25": "rgba(95, 129, 255, 0.25)",
            "--theme-secondary-50": "rgba(95, 129, 255, 0.5)",
            "--theme-border-subtle": "rgba(95, 129, 255, 0.2)",
          } as CSSProperties
        }
      >
        <p className="mb-3 text-sm font-semibold">Modo escuro (app)</p>
        <div className="grid gap-3  ">
          <InfoBox title="Jobs em fila" number={42} color="secondary" />
        </div>
      </section>

      <section
        className={storyWrapperClassName}
        style={
          {
            "--color-app-bg": "#f3f4f7",
            "--color-app-fg": "#0e1862",
            "--color-sidebar-border": "rgba(14, 24, 98, 0.16)",
            "--theme-primary": "#f3f4f7",
            "--theme-secondary": "#0e1862",
            "--theme-secondary-25": "rgba(14, 24, 98, 0.25)",
            "--theme-secondary-50": "rgba(14, 24, 98, 0.5)",
            "--theme-border-subtle": "rgba(14, 24, 98, 0.16)",
          } as CSSProperties
        }
      >
        <p className="mb-3 text-sm font-semibold">Modo claro (app)</p>
        <div className="grid gap-3 ">
          <InfoBox title="Jobs em fila" number={42} color="secondary" />
        </div>
      </section>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Compara a `InfoBox` em modo escuro e modo claro usando os tokens de tema do app, exibindo também as duas variantes de cor do componente.",
      },
    },
  },
};

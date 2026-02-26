import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { InfoBox } from "./";

const storyWrapperClassName =
  "rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)";

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
            "--color-primary": "var(--color-slate-950)",
            "--color-primary-inverse": "var(--color-indigo-500)",
            "--color-secondary": "var(--color-indigo-500)",
            "--color-secondary-inverse": "var(--color-slate-950)",
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
            "--color-primary": "var(--color-slate-050)",
            "--color-primary-inverse": "var(--color-indigo-950)",
            "--color-secondary": "var(--color-indigo-950)",
            "--color-secondary-inverse": "var(--color-slate-050)",
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

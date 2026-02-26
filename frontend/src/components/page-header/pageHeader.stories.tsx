import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PageHeader } from "./pageHeader";

const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Cabeçalho simples de página com título, subtítulo e divisor inferior. Utilizado no cabeçalho das páginas.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-6 text-(--color-secondary)">
        <Story />
      </div>
    ),
  ],
  args: {
    title: "Jobs",
    subtitle:
      "Monitor collection jobs, inspect raw records, and run simple retry/stop actions.",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const TextoLongo: Story = {
  args: {
    title: "Preview",
    subtitle:
      "Inspect records returned by the selected source and section before exporting or validating downstream transformations.",
  },
};

export const ComparacaoDeModo: Story = {
  render: () => {
    const darkModeVars = {
      "--color-primary": "var(--color-slate-950)",
      "--color-primary-inverse": "var(--color-indigo-500)",
      "--color-secondary": "var(--color-indigo-500)",
      "--color-secondary-inverse": "var(--color-slate-950)",
    } as CSSProperties;

    const lightModeVars = {
      "--color-primary": "var(--color-slate-050)",
      "--color-primary-inverse": "var(--color-indigo-950)",
      "--color-secondary": "var(--color-indigo-950)",
      "--color-secondary-inverse": "var(--color-slate-050)",
    } as CSSProperties;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <section
          className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)"
          style={darkModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo escuro (app)</p>
          <PageHeader
            title="Jobs"
            subtitle="Monitor collection jobs, inspect raw records, and run simple retry/stop actions."
          />
        </section>

        <section
          className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)"
          style={lightModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo claro (app)</p>
          <PageHeader
            title="Jobs"
            subtitle="Monitor collection jobs, inspect raw records, and run simple retry/stop actions."
          />
        </section>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstra o componente usando os tokens de cor do app em light/dark.",
      },
    },
  },
};

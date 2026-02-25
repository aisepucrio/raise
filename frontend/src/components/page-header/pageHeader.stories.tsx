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
      <div className="rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-6 text-(--color-app-fg)">
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
      "--color-app-bg": "var(--color-blueberry-900)",
      "--color-app-fg": "var(--color-metal-50)",
      "--color-sidebar-border": "var(--color-lighter-bluebery-900)",
      "--color-table-caption": "rgba(243, 244, 247, 0.68)",
    } as CSSProperties;

    const lightModeVars = {
      "--color-app-bg": "var(--color-metal-50)",
      "--color-app-fg": "var(--color-blueberry-900)",
      "--color-sidebar-border": "var(--color-darker-metal-50)",
      "--color-table-caption": "rgba(14, 24, 98, 0.68)",
    } as CSSProperties;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <section
          className="rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-4 text-(--color-app-fg)"
          style={darkModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo escuro (app)</p>
          <PageHeader
            title="Jobs"
            subtitle="Monitor collection jobs, inspect raw records, and run simple retry/stop actions."
          />
        </section>

        <section
          className="rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-4 text-(--color-app-fg)"
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

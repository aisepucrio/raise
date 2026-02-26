import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormatStatusItem } from "./formatStatusItem";

const meta = {
  title: "Components/FormatStatusItem",
  component: FormatStatusItem,
  tags: ["autodocs"],
  argTypes: {
    className: { control: false },
  },
  args: {
    status: "STARTED",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Formata o status bruto vindo da API de jobs, aplicando label amigável, cor por tema e regras de ações internas (stop/restart).",
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
} satisfies Meta<typeof FormatStatusItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const ListaDeStatus: Story = {
  render: () => {
    const statuses = [
      "STARTED",
      "PENDING",
      "SUCCESS",
      "FAILURE",
      "REVOKED",
      "PROGRESS",
      "UNKNOWN",
    ];

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {statuses.map((status) => (
          <div
            key={status}
            className="flex items-center justify-between rounded-md border border-(--color-secondary-subtle) px-3 py-2"
          >
            <span className="text-sm text-(--color-secondary-muted)">{status}</span>
            <FormatStatusItem status={status} />
          </div>
        ))}
      </div>
    );
  },
};

export const ComparacaoDeModo: Story = {
  render: () => {
    const darkModeVars = {
      "--color-primary": "var(--color-slate-950)",
      "--color-primary-inverse": "var(--color-indigo-500)",
      "--color-secondary": "var(--color-indigo-500)",
      "--color-secondary-inverse": "var(--color-slate-950)",
      "--color-indigo": "var(--color-indigo-200)",
      "--color-amber": "var(--color-amber-300)",
      "--color-teal": "var(--color-teal-300)",
      "--color-rose": "var(--color-rose-300)",
      "--color-slate": "var(--color-slate-300)",
      "--color-steel": "var(--color-steel-300)",
    } as CSSProperties;

    const lightModeVars = {
      "--color-primary": "var(--color-slate-050)",
      "--color-primary-inverse": "var(--color-indigo-950)",
      "--color-secondary": "var(--color-indigo-950)",
      "--color-secondary-inverse": "var(--color-slate-050)",
      "--color-indigo": "var(--color-indigo-400)",
      "--color-amber": "var(--color-amber-700)",
      "--color-teal": "var(--color-teal-700)",
      "--color-rose": "var(--color-rose-600)",
      "--color-slate": "var(--color-slate-500)",
      "--color-steel": "var(--color-steel-600)",
    } as CSSProperties;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <section
          className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)"
          style={darkModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo escuro</p>
          <div className="space-y-2">
            <FormatStatusItem status="STARTED" />
            <FormatStatusItem status="PENDING" />
            <FormatStatusItem status="SUCCESS" />
            <FormatStatusItem status="FAILURE" />
            <FormatStatusItem status="REVOKED" />
          </div>
        </section>

        <section
          className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)"
          style={lightModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo claro</p>
          <div className="space-y-2">
            <FormatStatusItem status="STARTED" />
            <FormatStatusItem status="PENDING" />
            <FormatStatusItem status="SUCCESS" />
            <FormatStatusItem status="FAILURE" />
            <FormatStatusItem status="REVOKED" />
          </div>
        </section>
      </div>
    );
  },
};

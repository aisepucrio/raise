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
      <div className="rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-6 text-(--color-app-fg)">
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
            className="flex items-center justify-between rounded-md border border-(--color-table-border) px-3 py-2"
          >
            <span className="text-sm text-(--color-table-caption)">{status}</span>
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
      "--color-app-bg": "var(--color-blueberry-900)",
      "--color-app-fg": "var(--color-metal-50)",
      "--color-sidebar-border": "var(--color-lighter-bluebery-900)",
      "--color-table-border": "rgba(243, 244, 247, 0.14)",
      "--color-table-caption": "rgba(243, 244, 247, 0.68)",
      "--color-status-in-progress-color": "var(--color-status-in-progress-color-dark)",
      "--color-status-in-queue-color": "var(--color-status-in-queue-color-dark)",
      "--color-status-finished-color": "var(--color-status-finished-color-dark)",
      "--color-status-failure-color": "var(--color-status-failure-color-dark)",
      "--color-status-cancelled-color": "var(--color-status-cancelled-color-dark)",
      "--color-status-unknown-color": "var(--color-status-unknown-color-dark)",
    } as CSSProperties;

    const lightModeVars = {
      "--color-app-bg": "var(--color-metal-50)",
      "--color-app-fg": "var(--color-blueberry-900)",
      "--color-sidebar-border": "var(--color-darker-metal-50)",
      "--color-table-border": "rgba(14, 24, 98, 0.14)",
      "--color-table-caption": "rgba(14, 24, 98, 0.68)",
      "--color-status-in-progress-color": "var(--color-status-in-progress-color-light)",
      "--color-status-in-queue-color": "var(--color-status-in-queue-color-light)",
      "--color-status-finished-color": "var(--color-status-finished-color-light)",
      "--color-status-failure-color": "var(--color-status-failure-color-light)",
      "--color-status-cancelled-color": "var(--color-status-cancelled-color-light)",
      "--color-status-unknown-color": "var(--color-status-unknown-color-light)",
    } as CSSProperties;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <section
          className="rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-4 text-(--color-app-fg)"
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
          className="rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-4 text-(--color-app-fg)"
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

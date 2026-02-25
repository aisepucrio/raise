import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormatDateItem } from "./formatDateItem";

const meta = {
  title: "Components/FormatDateItem",
  component: FormatDateItem,
  tags: ["autodocs"],
  args: {
    value: "02/02/2026",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Componente simples para exibir datas em formato amigável (ex.: `Feb 2, 2026`) com fallback para o valor original quando não for possível parsear.",
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
} satisfies Meta<typeof FormatDateItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const VariacoesComuns: Story = {
  render: () => {
    const values = [
      "02/02/2026",
      "2026-02-02",
      "2026-02-02T10:15:00Z",
      "invalid-date",
      "",
    ];

    return (
      <div className="grid gap-2">
        {values.map((value) => (
          <div
            key={value || "empty"}
            className="flex items-center justify-between rounded-md border border-(--color-table-border) px-3 py-2"
          >
            <span className="text-sm text-(--color-table-caption)">
              {value || "(empty)"}
            </span>
            <FormatDateItem value={value} />
          </div>
        ))}
      </div>
    );
  },
};

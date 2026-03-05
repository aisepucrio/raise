import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormatDateItem } from "./formatDateItem";

const meta = {
  title: "Components/FormatDateItem",
  component: FormatDateItem,
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "text" },
      description: "date bruta recebida for formatting.",
      table: { type: { summary: "string | null" } },
    },
    locale: {
      control: { type: "text" },
      description: "Locale used in the formatting of the date.",
      table: { type: { summary: "string" }, defaultValue: { summary: "en-US" } },
    },
  },
  args: {
    value: "02/02/2026",
  },
  parameters: {
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Component to display dates in readable format with fallback to original value.",
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
} satisfies Meta<typeof FormatDateItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "formatting standard of the value of date single.",
      },
    },
  },
};

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
            className="flex items-center justify-between rounded-md border border-(--color-secondary-subtle) px-3 py-2"
          >
            <span className="text-sm text-(--color-secondary-muted)">
              {value || "(empty)"}
            </span>
            <FormatDateItem value={value} />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Compara inputs comuns (ISO, BR, invalid and empty).",
      },
    },
  },
};

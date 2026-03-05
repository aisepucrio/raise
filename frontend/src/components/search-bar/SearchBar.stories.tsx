import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchBar } from "./SearchBar";

function InteractiveDemo({ expandable = false }: { expandable?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-3">
      <div className="w-full max-w-3xl">
        <SearchBar
          id="storybook-search-bar"
          onSearchChange={setSearchTerm}
          expandable={expandable}
        />
      </div>

      <div className="rounded-md border border-(--color-secondary-subtle) px-3 py-2 text-sm text-(--color-secondary-muted)">
        Debounced search: {searchTerm || "(empty)"}
      </div>
    </div>
  );
}

const meta = {
  title: "Components/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
  argTypes: {
    id: {
      control: { type: "text" },
      description: "ID do campo de busca.",
      table: { type: { summary: "string" } },
    },
    onSearchChange: {
      control: false,
      description: "Callback disparado após debounce do termo digitado.",
      table: { type: { summary: "(searchTerm: string) => void" } },
    },
    label: {
      control: { type: "text" },
      description: "Label do campo de busca.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Search" } },
    },
    placeholder: {
      control: { type: "text" },
      description: "Placeholder do input de busca.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Type..." } },
    },
    debounceMs: {
      control: { type: "number" },
      description: "Tempo de debounce (ms) antes de disparar `onSearchChange`.",
      table: { type: { summary: "number" }, defaultValue: { summary: "350" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "Desabilita interação com a busca.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    expandable: {
      control: { type: "boolean" },
      description: "Ativa expansão horizontal do campo ao focar ou digitar.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Barra de busca com debounce interno e opção de modo expansível.",
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
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: "Busca padrão com feedback do termo aplicado após debounce.",
      },
    },
  },
};

export const Expandivel: Story = {
  render: () => <InteractiveDemo expandable />,
  parameters: {
    docs: {
      description: {
        story: "Busca em modo expansível para economizar espaço no layout.",
      },
    },
  },
};

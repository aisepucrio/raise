import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SourceSelectFilter } from "./SourceSelectFilter";

function InteractiveDemo() {
  const [selectedValue, setSelectedValue] = useState("");

  return (
    <div className="space-y-3">
      <SourceSelectFilter
        id="storybook-source-select"
        label="Repository"
        value={selectedValue}
        onChange={setSelectedValue}
        options={[
          { value: "1", label: "acme/api" },
          { value: "2", label: "acme/web" },
        ]}
        allOptionLabel="All repositories"
        wrapperClassName="w-full min-w-56"
        className="font-semibold"
      />

      <div className="rounded-md border border-(--color-secondary-subtle) px-3 py-2 text-sm text-(--color-secondary-muted)">
        selected={selectedValue || "(all)"}
      </div>
    </div>
  );
}

const meta = {
  title: "Components/SourceSelectFilter",
  component: SourceSelectFilter,
  tags: ["autodocs"],
  argTypes: {
    id: {
      control: { type: "text" },
      description: "ID do campo select.",
      table: { type: { summary: "string" } },
    },
    label: {
      control: { type: "text" },
      description: "Rótulo exibido acima do select.",
      table: { type: { summary: "string" } },
    },
    value: {
      control: { type: "text" },
      description: "Valor atualmente selecionado.",
      table: { type: { summary: "string" } },
    },
    onChange: {
      control: false,
      description: "Callback chamado quando a opção selecionada muda.",
      table: { type: { summary: "(value: string) => void" } },
    },
    options: {
      control: false,
      description: "Lista de opções disponíveis para seleção.",
      table: { type: { summary: "{ value: string; label: string }[]" } },
    },
    allOptionLabel: {
      control: { type: "text" },
      description: "Texto da opção neutra (todos).",
      table: { type: { summary: "string" } },
    },
    isOptionsPending: {
      control: { type: "boolean" },
      description: "Indica carregamento de opções.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    wrapperClassName: {
      control: false,
      description: "Classe CSS adicional do wrapper do campo.",
      table: { type: { summary: "string" } },
    },
    className: {
      control: false,
      description: "Classe CSS adicional aplicada ao select.",
      table: { type: { summary: "string" } },
    },
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Select para escolher uma fonte dentro de uma linha de filtros.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SourceSelectFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: "Demonstra seleção de fonte com feedback do valor escolhido.",
      },
    },
  },
};

export const CarregandoOpcoes: Story = {
  args: {
    id: "storybook-source-select-pending",
    label: "Project",
    value: "",
    onChange: () => undefined,
    options: [],
    allOptionLabel: "All projects",
    isOptionsPending: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Estado com lista vazia e carregamento em andamento.",
      },
    },
  },
};

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SelectionButton } from "./selectionButton";

const meta = {
  title: "Components/SelectionButton",
  component: SelectionButton,
  tags: ["autodocs"],
  argTypes: {
    className: { control: false },
    onPressedChange: { action: "pressedChange" },
  },
  args: {
    text: "Issues",
    defaultPressed: false,
    fullWidth: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Botão de seleção (toggle) para opções de formulário. Suporta uso não-controlado (`defaultPressed`) e controlado (`pressed` + `onPressedChange`) e reaproveita o visual `selectable` do botão base.",
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
} satisfies Meta<typeof SelectionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const PressionadoPorPadrao: Story = {
  args: {
    text: "Commits",
    defaultPressed: true,
  },
};

export const ControladoExternamente: Story = {
  render: () => {
    const [pressed, setPressed] = useState(false);

    return (
      <div className="flex flex-wrap items-center gap-3">
        <SelectionButton
          text="Pull requests"
          pressed={pressed}
          onPressedChange={setPressed}
          fullWidth={false}
        />

        <button
          type="button"
          onClick={() => setPressed((value) => !value)}
          className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
        >
          Toggle from outside
        </button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Exemplo controlado: o estado ativo pode ser alterado pelo clique no próprio botão ou por um controle externo.",
      },
    },
  },
};

export const GrupoDeSelecao: Story = {
  render: () => (
    <div className="grid gap-2 sm:grid-cols-2">
      <SelectionButton text="Issues" />
      <SelectionButton text="Comments" defaultPressed />
      <SelectionButton text="Pull requests" />
      <SelectionButton text="Commits" />
    </div>
  ),
};

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SelectionButton } from "./selectionButton";

const meta = {
  title: "Components/SelectionButton",
  component: SelectionButton,
  tags: ["autodocs"],
  argTypes: {
    text: {
      control: { type: "text" },
      description: "Texto exibido no botão toggle.",
      table: { type: { summary: "string" } },
    },
    pressed: {
      control: { type: "boolean" },
      description: "Estado controlado do botão.",
      table: { type: { summary: "boolean" } },
    },
    defaultPressed: {
      control: { type: "boolean" },
      description: "Estado inicial para uso não controlado.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    onPressedChange: {
      action: "pressedChange",
      description: "Callback disparado quando o estado pressed muda.",
      table: { type: { summary: "(pressed: boolean) => void" } },
    },
    size: {
      control: { type: "inline-radio" },
      options: ["default", "sm"],
      description: "Tamanho visual do botão.",
      table: { type: { summary: "\"default\" | \"sm\"" }, defaultValue: { summary: "default" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "Desabilita interação.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    fullWidth: {
      control: { type: "boolean" },
      description: "Ocupa toda largura do container quando habilitado.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    className: {
      control: false,
      description: "Classe CSS adicional aplicada ao botão.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    text: "Issues",
    defaultPressed: false,
    fullWidth: false,
  },
  parameters: {
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Botão de seleção do tipo toggle para opções de formulário.",
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

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Botão de seleção padrão em modo não controlado.",
      },
    },
  },
};

export const PressionadoPorPadrao: Story = {
  args: {
    text: "Commits",
    defaultPressed: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Inicializa com estado pressionado ativo.",
      },
    },
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
        story: "Exemplo com estado controlado por um componente externo.",
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
  parameters: {
    docs: {
      description: {
        story: "Exemplo com múltiplos botões para seleção por categoria.",
      },
    },
  },
};

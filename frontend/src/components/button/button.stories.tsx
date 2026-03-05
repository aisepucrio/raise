import { ArrowRight, Download, Plus } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    text: {
      control: { type: "text" },
      description: "Texto exibido no botão.",
      table: { type: { summary: "string" } },
    },
    icon: {
      control: false,
      description: "Ícone opcional exibido no botão.",
      table: { type: { summary: "ReactNode" } },
    },
    onClick: {
      action: "clicked",
      description: "Callback disparado no clique do botão.",
      table: { type: { summary: "MouseEventHandler<HTMLButtonElement>" } },
    },
    iconSide: {
      control: { type: "inline-radio" },
      options: ["left", "right"],
      description: "Define o lado do ícone quando há texto.",
      table: { type: { summary: "\"left\" | \"right\"" }, defaultValue: { summary: "left" } },
    },
    type: {
      control: { type: "inline-radio" },
      options: ["button", "submit", "reset"],
      description: "Tipo nativo do botão.",
      table: { type: { summary: "\"button\" | \"submit\" | \"reset\"" }, defaultValue: { summary: "button" } },
    },
    size: {
      control: { type: "inline-radio" },
      options: ["default", "sm"],
      description: "Tamanho visual do botão.",
      table: { type: { summary: "\"default\" | \"sm\"" }, defaultValue: { summary: "default" } },
    },
    fullWidth: {
      control: { type: "boolean" },
      description: "Quando `true`, ocupa largura total do container.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    variant: {
      control: { type: "inline-radio" },
      options: ["default", "selectable"],
      description: "Variante visual do botão.",
      table: { type: { summary: "\"default\" | \"selectable\"" }, defaultValue: { summary: "default" } },
    },
    selected: {
      control: { type: "boolean" },
      description: "Estado selecionado (usado na variante `selectable`).",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "Desabilita clique e estilo interativo.",
      table: { type: { summary: "boolean" } },
    },
    className: {
      control: false,
      description: "Classe CSS adicional aplicada ao botão.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    text: "Salvar",
    type: "button",
    iconSide: "left",
  },
  parameters: {
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Botão reutilizável com suporte a texto, ícone e estados comuns.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl border border-(--color-secondary-soft) p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Botão padrão com texto simples.",
      },
    },
  },
};

export const ComIconeEsquerda: Story = {
  args: {
    text: "Novo registro",
    icon: <Plus />,
    iconSide: "left",
    "aria-label": "Novo registro",
  },
  parameters: {
    docs: {
      description: {
        story: "Botão com ícone à esquerda e texto.",
      },
    },
  },
};

export const ComIconeDireita: Story = {
  args: {
    text: "Continuar",
    icon: <ArrowRight />,
    iconSide: "right",
    "aria-label": "Continuar",
  },
  parameters: {
    docs: {
      description: {
        story: "Botão com ícone à direita e texto.",
      },
    },
  },
};

export const SomenteIcone: Story = {
  args: {
    text: undefined,
    icon: <Download />,
    "aria-label": "Baixar relatório",
    title: "Baixar relatório",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Quando usado sem texto, defina `aria-label` para manter nome acessível.",
      },
    },
  },
};

export const Desabilitado: Story = {
  args: {
    text: "Salvar alterações",
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Estado desabilitado sem interação do usuário.",
      },
    },
  },
};

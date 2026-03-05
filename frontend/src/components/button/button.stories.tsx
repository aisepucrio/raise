import { ArrowRight, Download, Plus } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    icon: { control: false },
    onClick: { action: "clicked" },
    iconSide: {
      control: { type: "inline-radio" },
      options: ["left", "right"],
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
};

export const ComIconeEsquerda: Story = {
  args: {
    text: "Novo registro",
    icon: <Plus />,
    iconSide: "left",
    "aria-label": "Novo registro",
  },
};

export const ComIconeDireita: Story = {
  args: {
    text: "Continuar",
    icon: <ArrowRight />,
    iconSide: "right",
    "aria-label": "Continuar",
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
};

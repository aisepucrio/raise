import type { Meta, StoryObj } from "@storybook/react-vite";
import FormDateSelector from "./FormDateSelector";

const meta = {
  title: "Components/Form/FormDateSelector",
  component: FormDateSelector,
  tags: ["autodocs"],
  argTypes: {
    wrapperClassName: { control: false },
    variant: {
      control: { type: "inline-radio" },
      options: ["outlined", "filled"],
    },
    onChange: { action: "changed" },
  },
  args: {
    id: "form-date-demo",
    label: "Data de coleta",
    hint: "Seletor de data nativo do navegador.",
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Campo de data com label, hint e erro no mesmo padrão dos campos de formulário.",
      },
    },
  },
} satisfies Meta<typeof FormDateSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const ComValorInicial: Story = {
  args: {
    id: "form-date-filled",
    defaultValue: "2026-02-25",
    hint: "Exemplo preenchido.",
  },
};

export const ComErro: Story = {
  args: {
    id: "form-date-error",
    required: true,
    error: "Informe uma data válida.",
    hint: undefined,
  },
};

export const VarianteFilled: Story = {
  args: {
    id: "form-date-filled-variant",
    variant: "filled",
    defaultValue: "2026-02-27",
    hint: "Exemplo com a variante filled.",
  },
};

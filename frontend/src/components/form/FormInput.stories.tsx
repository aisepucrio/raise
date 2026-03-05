import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search } from "lucide-react";
import FormInput from "./FormInput";

const meta = {
  title: "Components/Form/FormInput",
  component: FormInput,
  tags: ["autodocs"],
  argTypes: {
    wrapperClassName: { control: false },
    icon: { control: false },
    iconPosition: {
      control: { type: "inline-radio" },
      options: ["left", "right"],
    },
    variant: {
      control: { type: "inline-radio" },
      options: ["outlined", "filled"],
    },
    onChange: { action: "changed" },
  },
  args: {
    id: "form-input-demo",
    label: "Nome",
    placeholder: "Digite seu nome",
    hint: "Campo de texto padrão.",
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Campo de texto com label, hint e erro no padrão visual do formulário.",
      },
    },
  },
} satisfies Meta<typeof FormInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Texto: Story = {};

export const Email: Story = {
  args: {
    id: "form-input-email",
    type: "email",
    label: "E-mail",
    placeholder: "nome@empresa.com",
    autoComplete: "email",
    hint: "Usa atributos nativos do input.",
  },
};

export const ComErro: Story = {
  args: {
    id: "form-input-error",
    label: "Usuário",
    required: true,
    error: "Informe um usuário válido.",
    hint: undefined,
  },
};

export const Desabilitado: Story = {
  args: {
    id: "form-input-disabled",
    label: "Código",
    defaultValue: "STNL-001",
    disabled: true,
    hint: "Exemplo de estado desabilitado.",
  },
};

export const VarianteFilled: Story = {
  args: {
    id: "form-input-filled",
    label: "Busca",
    placeholder: "Pesquisar por repositório",
    variant: "filled",
    hint: "Exemplo com a variante filled.",
  },
};

export const ComIcone: Story = {
  args: {
    id: "form-input-icon",
    label: "Search",
    placeholder: "Type...",
    icon: <Search className="size-4" />,
    hint: "Exemplo com icone opcional.",
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import FormInput from "./FormInput";

const meta = {
  title: "Components/Form/FormInput",
  component: FormInput,
  tags: ["autodocs"],
  argTypes: {
    wrapperClassName: { control: false },
    onChange: { action: "changed" },
  },
  args: {
    id: "form-input-demo",
    label: "Nome",
    placeholder: "Digite seu nome",
    hint: "Campo de texto padrão.",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Input nativo encapsulado com `FormFieldBase`, usando estilos e mensagens padronizadas.",
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

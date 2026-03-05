import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search } from "lucide-react";
import FormInput from "./FormInput";

const meta = {
  title: "Components/Form/FormInput",
  component: FormInput,
  tags: ["autodocs"],
  argTypes: {
    id: {
      control: { type: "text" },
      description: "ID do input para associação com label.",
      table: { type: { summary: "string" } },
    },
    label: {
      control: { type: "text" },
      description: "Rótulo exibido para o campo.",
      table: { type: { summary: "string" } },
    },
    placeholder: {
      control: { type: "text" },
      description: "Placeholder do input.",
      table: { type: { summary: "string" } },
    },
    hint: {
      control: { type: "text" },
      description: "Mensagem de apoio exibida abaixo do campo.",
      table: { type: { summary: "string" } },
    },
    error: {
      control: { type: "text" },
      description: "Mensagem de erro exibida abaixo do campo.",
      table: { type: { summary: "string" } },
    },
    type: {
      control: { type: "text" },
      description: "Tipo nativo do input HTML.",
      table: { type: { summary: "InputHTMLAttributes<HTMLInputElement>['type']" } },
    },
    required: {
      control: { type: "boolean" },
      description: "Marca o campo como obrigatório.",
      table: { type: { summary: "boolean" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "Desabilita interação com o campo.",
      table: { type: { summary: "boolean" } },
    },
    autoComplete: {
      control: { type: "text" },
      description: "Valor do atributo nativo `autoComplete`.",
      table: { type: { summary: "string" } },
    },
    defaultValue: {
      control: { type: "text" },
      description: "Valor inicial para uso não controlado.",
      table: { type: { summary: "string | number | readonly string[]" } },
    },
    value: {
      control: { type: "text" },
      description: "Valor controlado do campo.",
      table: { type: { summary: "string | number | readonly string[]" } },
    },
    wrapperClassName: {
      control: false,
      description: "Classe CSS adicional do wrapper.",
      table: { type: { summary: "string" } },
    },
    icon: {
      control: false,
      description: "Ícone opcional exibido dentro do input.",
      table: { type: { summary: "ReactNode" } },
    },
    iconPosition: {
      control: { type: "inline-radio" },
      options: ["left", "right"],
      description: "Define o lado do ícone dentro do input.",
      table: { type: { summary: "\"left\" | \"right\"" }, defaultValue: { summary: "left" } },
    },
    labelPosition: {
      control: { type: "inline-radio" },
      options: ["top", "left"],
      description: "Posição do label em relação ao campo.",
      table: { type: { summary: "\"top\" | \"left\"" }, defaultValue: { summary: "top" } },
    },
    variant: {
      control: { type: "inline-radio" },
      options: ["outlined", "filled"],
      description: "Variante visual do campo.",
      table: { type: { summary: "\"outlined\" | \"filled\"" }, defaultValue: { summary: "outlined" } },
    },
    onChange: {
      action: "changed",
      description: "Callback disparado ao alterar o valor do campo.",
      table: { type: { summary: "ChangeEventHandler<HTMLInputElement>" } },
    },
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

export const Texto: Story = {
  parameters: {
    docs: {
      description: {
        story: "Campo de texto padrão para entrada simples.",
      },
    },
  },
};

export const Email: Story = {
  args: {
    id: "form-input-email",
    type: "email",
    label: "E-mail",
    placeholder: "nome@empresa.com",
    autoComplete: "email",
    hint: "Usa atributos nativos do input.",
  },
  parameters: {
    docs: {
      description: {
        story: "Configuração para e-mail com tipo e `autoComplete` apropriados.",
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: "Estado de validação com mensagem de erro.",
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: "Campo desabilitado para leitura sem edição.",
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: "Exemplo da variante visual `filled`.",
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: "Campo com ícone decorativo dentro da área de input.",
      },
    },
  },
};

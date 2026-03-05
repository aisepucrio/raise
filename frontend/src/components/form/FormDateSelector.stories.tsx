import type { Meta, StoryObj } from "@storybook/react-vite";
import FormDateSelector from "./FormDateSelector";

const meta = {
  title: "Components/Form/FormDateSelector",
  component: FormDateSelector,
  tags: ["autodocs"],
  argTypes: {
    id: {
      control: { type: "text" },
      description: "ID do campo de data.",
      table: { type: { summary: "string" } },
    },
    label: {
      control: { type: "text" },
      description: "Rótulo exibido para o campo.",
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
    min: {
      control: { type: "text" },
      description: "Data mínima permitida no formato `YYYY-MM-DD`.",
      table: { type: { summary: "string" } },
    },
    max: {
      control: { type: "text" },
      description: "Data máxima permitida no formato `YYYY-MM-DD`.",
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
    labelPosition: {
      control: { type: "inline-radio" },
      options: ["top", "left"],
      description: "Posição do label em relação ao campo.",
      table: { type: { summary: "\"top\" | \"left\"" }, defaultValue: { summary: "top" } },
    },
    variant: {
      control: { type: "inline-radio" },
      options: ["outlined", "filled"],
      description: "Variante visual do campo de data.",
      table: { type: { summary: "\"outlined\" | \"filled\"" }, defaultValue: { summary: "outlined" } },
    },
    onChange: {
      action: "changed",
      description: "Callback disparado ao alterar a data.",
      table: { type: { summary: "ChangeEventHandler<HTMLInputElement>" } },
    },
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

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Campo de data padrão no estilo do formulário.",
      },
    },
  },
};

export const ComValorInicial: Story = {
  args: {
    id: "form-date-filled",
    defaultValue: "2026-02-25",
    hint: "Exemplo preenchido.",
  },
  parameters: {
    docs: {
      description: {
        story: "Campo já preenchido com uma data inicial.",
      },
    },
  },
};

export const ComErro: Story = {
  args: {
    id: "form-date-error",
    required: true,
    error: "Informe uma data válida.",
    hint: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: "Estado com validação e mensagem de erro.",
      },
    },
  },
};

export const VarianteFilled: Story = {
  args: {
    id: "form-date-filled-variant",
    variant: "filled",
    defaultValue: "2026-02-27",
    hint: "Exemplo com a variante filled.",
  },
  parameters: {
    docs: {
      description: {
        story: "Exemplo visual usando a variante `filled`.",
      },
    },
  },
};

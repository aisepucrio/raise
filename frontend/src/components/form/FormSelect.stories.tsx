import type { Meta, StoryObj } from "@storybook/react-vite";
import FormSelect from "./FormSelect";

const meta = {
  title: "Components/Form/FormSelect",
  component: FormSelect,
  tags: ["autodocs"],
  argTypes: {
    id: {
      control: { type: "text" },
      description: "ID do select para associação com label.",
      table: { type: { summary: "string" } },
    },
    label: {
      control: { type: "text" },
      description: "Rótulo exibido acima do campo.",
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
    defaultValue: {
      control: { type: "text" },
      description: "Valor inicial para uso não controlado.",
      table: { type: { summary: "string | number | readonly string[]" } },
    },
    value: {
      control: { type: "text" },
      description: "Valor controlado do select.",
      table: { type: { summary: "string | number | readonly string[]" } },
    },
    children: {
      control: false,
      description: "Opções (`<option>`) renderizadas dentro do select.",
      table: { type: { summary: "ReactNode" } },
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
      description: "Variante visual do select.",
      table: { type: { summary: "\"outlined\" | \"filled\"" }, defaultValue: { summary: "outlined" } },
    },
    onChange: {
      action: "changed",
      description: "Callback disparado ao alterar a opção selecionada.",
      table: { type: { summary: "ChangeEventHandler<HTMLSelectElement>" } },
    },
  },
  args: {
    id: "form-select-demo",
    label: "Fonte",
    defaultValue: "",
    hint: "Select com ícone animado e estados padrão.",
    children: (
      <>
        <option value="" disabled>
          Selecione uma opção
        </option>
        <option value="github">GitHub</option>
        <option value="jira">Jira</option>
        <option value="stackoverflow">Stack Overflow</option>
      </>
    ),
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Campo select com o mesmo padrão visual e de validação dos demais campos de formulário.",
      },
    },
  },
} satisfies Meta<typeof FormSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Select padrão com opções de fonte.",
      },
    },
  },
};

export const ObrigatorioComErro: Story = {
  args: {
    id: "form-select-error",
    required: true,
    error: "Selecione uma fonte.",
    hint: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: "Estado de validação com campo obrigatório e erro.",
      },
    },
  },
};

export const PreSelecionado: Story = {
  args: {
    id: "form-select-selected",
    defaultValue: "jira",
    hint: "Exemplo com valor inicial.",
  },
  parameters: {
    docs: {
      description: {
        story: "Exibe select com valor inicial já selecionado.",
      },
    },
  },
};

export const VarianteFilled: Story = {
  args: {
    id: "form-select-filled",
    defaultValue: "github",
    variant: "filled",
    hint: "Exemplo com a variante filled.",
  },
  parameters: {
    docs: {
      description: {
        story: "Exemplo visual com variante `filled`.",
      },
    },
  },
};

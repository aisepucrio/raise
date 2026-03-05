import type { Meta, StoryObj } from "@storybook/react-vite";
import FormFieldBase, { getFormControlClassName } from "./FormFieldBase";

const meta = {
  title: "Components/Form/FormFieldBase",
  component: FormFieldBase,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: { type: "text" },
      description: "Texto do rótulo exibido acima/ao lado do campo.",
      table: { type: { summary: "string" } },
    },
    htmlFor: {
      control: { type: "text" },
      description: "ID do campo associado ao label.",
      table: { type: { summary: "string" } },
    },
    hint: {
      control: { type: "text" },
      description: "Mensagem de apoio exibida abaixo do campo.",
      table: { type: { summary: "string" } },
    },
    error: {
      control: { type: "text" },
      description: "Mensagem de erro (substitui o hint quando presente).",
      table: { type: { summary: "string" } },
    },
    required: {
      control: { type: "boolean" },
      description: "Marca o campo como obrigatório no label.",
      table: { type: { summary: "boolean" } },
    },
    labelPosition: {
      control: { type: "inline-radio" },
      options: ["top", "left"],
      description: "Posição visual do label em relação ao conteúdo.",
      table: { type: { summary: "\"top\" | \"left\"" }, defaultValue: { summary: "top" } },
    },
    className: {
      control: false,
      description: "Classe CSS adicional do wrapper.",
      table: { type: { summary: "string" } },
    },
    children: {
      control: false,
      description: "Elemento de campo renderizado dentro do container.",
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    label: "Nome do campo",
    htmlFor: "field-base-demo",
    hint: "Use este container para padronizar label, hint e erro.",
    required: false,
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Componente base para organizar label, conteúdo do campo e mensagens de apoio ou erro.",
      },
    },
  },
  render: (args) => (
    <FormFieldBase {...args}>
      <input
        id={args.htmlFor}
        className={getFormControlClassName("outlined")}
        placeholder="Campo renderizado como child"
      />
    </FormFieldBase>
  ),
} satisfies Meta<typeof FormFieldBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComHint: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Exemplo base com label e mensagem de apoio.",
      },
    },
  },
};

export const ComErro: Story = {
  args: {
    hint: undefined,
    error: "Este campo é obrigatório.",
    required: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Exibe estado de erro com indicação de campo obrigatório.",
      },
    },
  },
};

export const SemLabel: Story = {
  args: {
    label: undefined,
    htmlFor: undefined,
    hint: "Também funciona sem label para layouts específicos.",
  },
  parameters: {
    docs: {
      description: {
        story: "Uso sem label para composições personalizadas de layout.",
      },
    },
  },
};

export const ComparacaoOutlinedEFilled: Story = {
  args: {
    label: undefined,
    htmlFor: undefined,
    hint: undefined,
    error: undefined,
  },
  render: () => (
    <div className="grid max-w-md gap-4">
      <FormFieldBase label="Outlined" htmlFor="field-base-outlined">
        <input
          id="field-base-outlined"
          className={getFormControlClassName("outlined")}
          placeholder="Variante outlined"
        />
      </FormFieldBase>

      <FormFieldBase label="Filled" htmlFor="field-base-filled">
        <input
          id="field-base-filled"
          className={getFormControlClassName("filled")}
          placeholder="Variante filled"
        />
      </FormFieldBase>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comparação visual entre os estilos de campo `outlined` e `filled`.",
      },
    },
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import FormFieldBase, { getFormControlClassName } from "./FormFieldBase";

const meta = {
  title: "Components/Form/FormFieldBase",
  component: FormFieldBase,
  tags: ["autodocs"],
  argTypes: {
    children: { control: false },
    className: { control: false },
    htmlFor: { control: "text" },
  },
  args: {
    label: "Nome do campo",
    htmlFor: "field-base-demo",
    hint: "Use este container para padronizar label, hint e erro.",
    required: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Componente base que organiza label, conteúdo do campo e mensagens de apoio/erro. A separação visual das variantes `outlined` e `filled` dos controles fica centralizada em `getFormControlClassName`, reutilizada pelos campos de formulário.",
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
};

export const ComErro: Story = {
  args: {
    hint: undefined,
    error: "Este campo é obrigatório.",
    required: true,
  },
};

export const SemLabel: Story = {
  args: {
    label: undefined,
    htmlFor: undefined,
    hint: "Também funciona sem label para layouts específicos.",
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
};

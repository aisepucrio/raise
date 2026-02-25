import type { Meta, StoryObj } from "@storybook/react-vite";
import FormFieldBase from "./FormFieldBase";
import { formControlBaseClassName } from "./formStyles";

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
          "Componente base que organiza label, conteúdo do campo e mensagens de apoio/erro.",
      },
    },
  },
  render: (args) => (
    <FormFieldBase {...args}>
      <input
        id={args.htmlFor}
        className={formControlBaseClassName}
        placeholder="Campo renderizado como child"
      />
    </FormFieldBase>
  ),
} satisfies Meta<typeof FormFieldBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComHint: Story = {};

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

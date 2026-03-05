import type { Meta, StoryObj } from "@storybook/react-vite";
import FormSelect from "./FormSelect";

const meta = {
  title: "Components/Form/FormSelect",
  component: FormSelect,
  tags: ["autodocs"],
  argTypes: {
    children: { control: false },
    wrapperClassName: { control: false },
    variant: {
      control: { type: "inline-radio" },
      options: ["outlined", "filled"],
    },
    onChange: { action: "changed" },
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

export const Padrao: Story = {};

export const ObrigatorioComErro: Story = {
  args: {
    id: "form-select-error",
    required: true,
    error: "Selecione uma fonte.",
    hint: undefined,
  },
};

export const PreSelecionado: Story = {
  args: {
    id: "form-select-selected",
    defaultValue: "jira",
    hint: "Exemplo com valor inicial.",
  },
};

export const VarianteFilled: Story = {
  args: {
    id: "form-select-filled",
    defaultValue: "github",
    variant: "filled",
    hint: "Exemplo com a variante filled.",
  },
};

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
    docs: {
      description: {
        component:
          "Select nativo com ícone animado (`motion`) e o mesmo padrão visual dos demais campos. A separação entre variantes `outlined` e `filled` também se aplica aqui, incluindo ajuste de contraste do ícone.",
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

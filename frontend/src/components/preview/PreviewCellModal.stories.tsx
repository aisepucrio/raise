import type { Meta, StoryObj } from "@storybook/react-vite";

import { PreviewCellModal } from "./PreviewCellModal";

const meta = {
  title: "Components/Preview/PreviewCellModal",
  component: PreviewCellModal,
  tags: ["autodocs"],
  args: {
    open: true,
    value: {
      id: 1,
      title: "Refactor preview",
      author: "ana",
      labels: ["frontend", "preview"],
    },
  },
  argTypes: {
    open: {
      control: { type: "boolean" },
      description: "Controla visibilidade do modal.",
      table: { type: { summary: "boolean" } },
    },
    onClose: {
      action: "close",
      description: "Callback disparado ao fechar o modal.",
      table: { type: { summary: "() => void" } },
    },
    value: {
      control: false,
      description: "Valor bruto da célula exibido no preview.",
      table: { type: { summary: "string | number | boolean | object | null" } },
    },
    dialogLabel: {
      control: { type: "text" },
      description: "Rótulo acessível aplicado ao diálogo.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Cell content preview" } },
    },
  },
  parameters: {
    wrapperSize: "large",
    docs: {
      description: {
        component:
          "Modal para exibir o conteúdo completo de uma célula.",
      },
    },
  },
} satisfies Meta<typeof PreviewCellModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Abre o modal com um objeto de exemplo renderizado no preview de código.",
      },
    },
  },
};

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
    onClose: { action: "close" },
  },
  parameters: {
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

export const Padrao: Story = {};

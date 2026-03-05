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
      description: "Controla visibility of the modal.",
      table: { type: { summary: "boolean" } },
    },
    onClose: {
      action: "close",
      description: "Callback triggered to close the modal.",
      table: { type: { summary: "() => void" } },
    },
    value: {
      control: false,
      description: "value bruto of the cell shown in the preview.",
      table: { type: { summary: "string | number | boolean | object | null" } },
    },
    dialogLabel: {
      control: { type: "text" },
      description: "label accessible aplicado to dialog.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Cell content preview" } },
    },
  },
  parameters: {
    wrapperSize: "large",
    docs: {
      description: {
        component:
          "Modal to display full cell content.",
      },
    },
  },
} satisfies Meta<typeof PreviewCellModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Abre the modal with the object of Example rendered in the preview of code.",
      },
    },
  },
};

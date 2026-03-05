import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormInput } from "@/components/form";
import { CollectFormModal } from "./CollectFormModal";

const meta = {
  title: "Components/Collect/CollectFormModal",
  component: CollectFormModal,
  tags: ["autodocs"],
  argTypes: {
    onClose: { action: "close" },
    onConfirm: { action: "confirm" },
  },
  args: {
    open: true,
    title: "Add repository",
    subtitle: "Use owner/repo or paste a GitHub URL.",
    confirmText: "Add",
    cancelText: "Cancel",
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Modal de formulário com ações padrão de cancelar e confirmar.",
      },
    },
  },
} satisfies Meta<typeof CollectFormModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: (args) => (
    <CollectFormModal {...args}>
      <FormInput
        id="storybook-collect-modal-field"
        label="Repository"
        value="openai/openai-python"
        onChange={() => undefined}
      />
    </CollectFormModal>
  ),
};

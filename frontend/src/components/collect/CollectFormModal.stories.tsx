import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormInput } from "@/components/form";
import { CollectFormModal } from "./CollectFormModal";

const meta = {
  title: "Components/Collect/CollectFormModal",
  component: CollectFormModal,
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: { type: "boolean" },
      description: "Controla visibilidade do modal.",
      table: { type: { summary: "boolean" } },
    },
    onClose: {
      action: "close",
      description: "Callback disparado ao cancelar/fechar modal.",
      table: { type: { summary: "() => void" } },
    },
    title: {
      control: { type: "text" },
      description: "Título principal do modal.",
      table: { type: { summary: "string" } },
    },
    subtitle: {
      control: { type: "text" },
      description: "Subtítulo opcional do modal.",
      table: { type: { summary: "string" } },
    },
    initialFocusRef: {
      control: false,
      description: "Ref opcional para foco inicial ao abrir modal.",
      table: { type: { summary: "{ current: HTMLElement | null }" } },
    },
    onConfirm: {
      action: "confirm",
      description: "Callback disparado ao confirmar o formulário.",
      table: { type: { summary: "() => void" } },
    },
    confirmText: {
      control: { type: "text" },
      description: "Texto do botão de confirmação.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Add" } },
    },
    cancelText: {
      control: { type: "text" },
      description: "Texto do botão de cancelamento.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Cancel" } },
    },
    children: {
      control: false,
      description: "Conteúdo de formulário renderizado dentro do modal.",
      table: { type: { summary: "ReactNode" } },
    },
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
  parameters: {
    docs: {
      description: {
        story: "Modal com conteúdo de formulário e ações de confirmar/cancelar.",
      },
    },
  },
};

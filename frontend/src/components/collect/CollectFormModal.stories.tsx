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
      description: "Controla visibility of the modal.",
      table: { type: { summary: "boolean" } },
    },
    onClose: {
      action: "close",
      description: "Callback triggered to cancelar/close modal.",
      table: { type: { summary: "() => void" } },
    },
    title: {
      control: { type: "text" },
      description: "title main of the modal.",
      table: { type: { summary: "string" } },
    },
    subtitle: {
      control: { type: "text" },
      description: "subtitle optional of the modal.",
      table: { type: { summary: "string" } },
    },
    initialFocusRef: {
      control: false,
      description: "Ref optional for focus initial to open modal.",
      table: { type: { summary: "{ current: HTMLElement | null }" } },
    },
    onConfirm: {
      action: "confirm",
      description: "Callback triggered to confirmar the form.",
      table: { type: { summary: "() => void" } },
    },
    confirmText: {
      control: { type: "text" },
      description: "text of the button of confirmation.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Add" } },
    },
    cancelText: {
      control: { type: "text" },
      description: "text of the button of cancelamento.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Cancel" } },
    },
    children: {
      control: false,
      description: "content of form rendered inside of the modal.",
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    open: true,
    title: "Add repository",
    subtitle: "Use owner/repo or paste the GitHub URL.",
    confirmText: "Add",
    cancelText: "Cancel",
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Modal de form com actions standard de cancelar e confirmar.",
      },
    },
  },
} satisfies Meta<typeof CollectFormModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
        story: "Modal with content of form and actions of confirmar/cancelar.",
      },
    },
  },
};

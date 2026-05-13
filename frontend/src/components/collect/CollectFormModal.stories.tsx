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
      description: "Controls modal visibility.",
      table: { type: { summary: "boolean" } },
    },
    onClose: {
      action: "close",
      description: "Callback triggered to cancel/close the modal.",
      table: { type: { summary: "() => void" } },
    },
    title: {
      control: { type: "text" },
      description: "Main modal title.",
      table: { type: { summary: "string" } },
    },
    subtitle: {
      control: { type: "text" },
      description: "Optional modal subtitle.",
      table: { type: { summary: "string" } },
    },
    initialFocusRef: {
      control: false,
      description: "Optional ref for initial focus when opening modal.",
      table: { type: { summary: "{ current: HTMLElement | null }" } },
    },
    onConfirm: {
      action: "confirm",
      description: "Callback triggered to confirm the form.",
      table: { type: { summary: "() => void" } },
    },
    confirmText: {
      control: { type: "text" },
      description: "Confirmation button text.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Add" } },
    },
    cancelText: {
      control: { type: "text" },
      description: "Cancel button text.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Cancel" } },
    },
    children: {
      control: false,
      description: "Form content rendered inside modal.",
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
          "Form modal with standard cancel and confirm actions.",
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
        story: "Modal with form content and confirm/cancel actions.",
      },
    },
  },
};

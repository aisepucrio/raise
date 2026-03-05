import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/button";

import { ModalShell } from "./modalShell";

const meta = {
  title: "Components/ModalShell",
  component: ModalShell,
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: { type: "boolean" },
      description: "Controls whether the modal is open.",
      table: { type: { summary: "boolean" } },
    },
    onClose: {
      action: "closed",
      description: "Callback triggered to close the modal.",
      table: { type: { summary: "() => void" } },
    },
    title: {
      control: { type: "text" },
      description: "title main of the modal.",
      table: { type: { summary: "string" } },
    },
    subtitle: {
      control: { type: "text" },
      description: "subtitle optional shown below of the title.",
      table: { type: { summary: "string" } },
    },
    initialFocusRef: {
      control: false,
      description: "reference optional for focus initial to open.",
      table: { type: { summary: "{ current: HTMLElement | null }" } },
    },
    children: {
      control: false,
      description: "content internal of the modal.",
      table: { type: { summary: "ReactNode" } },
    },
  },
  parameters: {
    wrapperSize: "medium",
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Base modal structure with overlay, header, and customizable content area.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[420px] bg-(--color-primary) text-(--color-secondary)">
        <Story />
      </div>
    ),
  ],
  args: {
    open: true,
    title: "Add repository",
    subtitle: "Use owner/repo or paste the GitHub URL.",
    children: (
      <div className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-(--color-secondary)">
            Repository
          </span>
          <input
            type="text"
            placeholder="owner/repo"
            className="w-full rounded-md border border-(--color-secondary-soft) bg-(--color-primary) px-3 py-2 text-sm text-(--color-secondary) outline-none"
          />
        </label>

        <div className="flex justify-end gap-2">
          <Button
            fullWidth={false}
            variant="selectable"
            selected={false}
            text="Cancel"
          />
          <Button fullWidth={false} text="Add" />
        </div>
      </div>
    ),
  },
} satisfies Meta<typeof ModalShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Modal complete with title, subtitle and content of form.",
      },
    },
  },
};

export const WithoutSubtitle: Story = {
  args: {
    subtitle: undefined,
    title: "Simple dialog",
  },
  parameters: {
    docs: {
      description: {
        story: "Example without subtitle for cases of dialog short.",
      },
    },
  },
};

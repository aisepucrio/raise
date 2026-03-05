import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/button";

import { ModalShell } from "./modalShell";

const meta = {
  title: "Components/ModalShell",
  component: ModalShell,
  tags: ["autodocs"],
  argTypes: {
    onClose: { action: "closed" },
    children: { control: false },
  },
  parameters: {
    wrapperSize: "medium",
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Estrutura base de modal com overlay, cabeçalho e área de conteúdo customizável.",
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
    subtitle: "Use owner/repo or paste a GitHub URL.",
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

export const Padrao: Story = {};

export const SemSubtitulo: Story = {
  args: {
    subtitle: undefined,
    title: "Simple dialog",
  },
};

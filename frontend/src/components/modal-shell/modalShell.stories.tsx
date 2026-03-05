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
      description: "Controla se o modal está aberto.",
      table: { type: { summary: "boolean" } },
    },
    onClose: {
      action: "closed",
      description: "Callback disparado ao fechar o modal.",
      table: { type: { summary: "() => void" } },
    },
    title: {
      control: { type: "text" },
      description: "Título principal do modal.",
      table: { type: { summary: "string" } },
    },
    subtitle: {
      control: { type: "text" },
      description: "Subtítulo opcional exibido abaixo do título.",
      table: { type: { summary: "string" } },
    },
    initialFocusRef: {
      control: false,
      description: "Referência opcional para foco inicial ao abrir.",
      table: { type: { summary: "{ current: HTMLElement | null }" } },
    },
    children: {
      control: false,
      description: "Conteúdo interno do modal.",
      table: { type: { summary: "ReactNode" } },
    },
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

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Modal completo com título, subtítulo e conteúdo de formulário.",
      },
    },
  },
};

export const SemSubtitulo: Story = {
  args: {
    subtitle: undefined,
    title: "Simple dialog",
  },
  parameters: {
    docs: {
      description: {
        story: "Exemplo sem subtítulo para casos de diálogo curto.",
      },
    },
  },
};

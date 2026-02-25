import type { CSSProperties } from "react";
import { ArrowRight, Download, Plus } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    icon: { control: false },
    onClick: { action: "clicked" },
    iconSide: {
      control: { type: "inline-radio" },
      options: ["left", "right"],
    },
  },
  args: {
    text: "Salvar",
    type: "button",
    iconSide: "left",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Componente de botão baseado em `button` nativo, com visual padrão do app (rounded-md, sem shadow) e API enxuta para texto, ícone e posição do ícone, incluindo suporte a botão somente com ícone.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl border border-(--color-sidebar-border) p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  args: {},
};

export const ComIconeEsquerda: Story = {
  args: {
    text: "Novo registro",
    icon: <Plus />,
    iconSide: "left",
    "aria-label": "Novo registro",
  },
};

export const ComIconeDireita: Story = {
  args: {
    text: "Continuar",
    icon: <ArrowRight />,
    iconSide: "right",
    "aria-label": "Continuar",
  },
};

export const SomenteIcone: Story = {
  args: {
    text: undefined,
    icon: <Download />,
    "aria-label": "Baixar relatório",
    title: "Baixar relatório",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Quando usado sem texto, defina `aria-label` para manter nome acessível.",
      },
    },
  },
};

export const Desabilitado: Story = {
  args: {
    text: "Salvar alterações",
    disabled: true,
  },
};

export const ComparacaoDeModo: Story = {
  render: () => {
    const darkModeVars = {
      "--color-app-bg": "var(--color-blueberry-900)",
      "--color-app-fg": "var(--color-metal-50)",
      "--color-form-bg": "var(--color-metal-50)",
      "--color-form-text": "var(--color-blueberry-900)",
      "--color-form-focus": "var(--color-darker-metal-50)",
      "--color-form-disabled-bg": "rgba(243, 244, 247, 0.6)",
      "--color-form-disabled-text": "rgba(14, 24, 98, 0.45)",
    } as CSSProperties;

    const lightModeVars = {
      "--color-app-bg": "var(--color-metal-50)",
      "--color-app-fg": "var(--color-blueberry-900)",
      "--color-form-bg": "var(--color-blueberry-900)",
      "--color-form-text": "var(--color-metal-50)",
      "--color-form-focus": "var(--color-lighter-bluebery-900)",
      "--color-form-disabled-bg": "rgba(14, 24, 98, 0.65)",
      "--color-form-disabled-text": "rgba(243, 244, 247, 0.65)",
    } as CSSProperties;

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <section
          className="rounded-xl border border-white/10 bg-(--color-app-bg) p-4 text-(--color-app-fg)"
          style={darkModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo escuro (app)</p>
          <div className="flex items-center gap-3">
            <Button text="Salvar" icon={<Plus />} fullWidth={false} />
            <Button icon={<Download />} aria-label="Baixar" title="Baixar" />
          </div>
        </section>

        <section
          className="rounded-xl border border-black/10 bg-(--color-app-bg) p-4 text-(--color-app-fg)"
          style={lightModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo claro (app)</p>
          <div className="flex items-center gap-3">
            <Button text="Salvar" icon={<Plus />} fullWidth={false} />
            <Button icon={<Download />} aria-label="Baixar" title="Baixar" />
          </div>
        </section>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstra a troca de cores baseada nos tokens do app/form sem variantes extras no componente.",
      },
    },
  },
};

import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  argTypes: {
    className: { control: false },
    style: { control: false },
    onCheckedChange: { action: "checkedChange" },
    size: {
      control: { type: "inline-radio" },
      options: ["default", "sm"],
    },
    variant: {
      control: { type: "inline-radio" },
      options: ["default", "theme-toggle"],
    },
    trackWidth: {
      control: false,
      description:
        "Largura opcional do track (number em px ou string, ex.: `100%`).",
    },
  },
  args: {
    "aria-label": "Ativar opção",
    defaultChecked: false,
    size: "default",
    variant: "default",
    trackWidth: 56,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Componente `Switch` derivado de shadcn/ui (Radix UI), adaptado para usar os tokens contextuais do app (`primary`/`secondary`) com inversão por modo.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl border border-(--color-secondary-soft) p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const Ligado: Story = {
  args: {
    defaultChecked: true,
  },
};

export const ThemeToggle: Story = {
  args: {
    variant: "theme-toggle",
    defaultChecked: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Variação usada no `ThemeSwitcher`, com track/thumb invertidos de forma consistente entre estados. (não é vizualizavel por aqui)",
      },
    },
  },
};

export const LarguraCustomizada: Story = {
  render: () => (
    <div className="w-52">
      <Switch
        aria-label="Theme toggle com largura em porcentagem"
        variant="theme-toggle"
        trackWidth="100%"
        defaultChecked
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Exemplo com `trackWidth="100%"` ocupando toda a largura disponível do container pai.',
      },
    },
  },
};

export const EstadosDesabilitados: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Switch aria-label="Desabilitado desligado" disabled trackWidth={56} />
      <Switch
        aria-label="Desabilitado ligado"
        disabled
        defaultChecked
        trackWidth={56}
      />
    </div>
  ),
};

export const ComparacaoDeModo: Story = {
  render: () => {
    const darkModeVars = {
      "--color-primary": "var(--color-slate-950)",
      "--color-primary-inverse": "var(--color-indigo-500)",
      "--color-secondary": "var(--color-indigo-500)",
      "--color-secondary-inverse": "var(--color-slate-950)",
    } as CSSProperties;

    const lightModeVars = {
      "--color-primary": "var(--color-slate-050)",
      "--color-primary-inverse": "var(--color-indigo-950)",
      "--color-secondary": "var(--color-indigo-950)",
      "--color-secondary-inverse": "var(--color-slate-050)",
    } as CSSProperties;

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <section
          className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)"
          style={darkModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo escuro (app)</p>
          <div className="flex items-center gap-3">
            <Switch aria-label="Escuro ligado" defaultChecked trackWidth={56} />
            <Switch aria-label="Escuro desligado" trackWidth={56} />
          </div>
        </section>

        <section
          className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)"
          style={lightModeVars}
        >
          <p className="mb-3 text-sm font-semibold">Modo claro (app)</p>
          <div className="flex items-center gap-3">
            <Switch aria-label="Claro ligado" defaultChecked trackWidth={56} />
            <Switch aria-label="Claro desligado" trackWidth={56} />
          </div>
        </section>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Mostra a inversão contextual de `primary`/`secondary` usada pelo app em cada modo.",
      },
    },
  },
};

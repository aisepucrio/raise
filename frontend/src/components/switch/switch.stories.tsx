import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  argTypes: {
    "aria-label": {
      control: { type: "text" },
      description: "Rótulo acessível obrigatório para leitores de tela.",
      table: { type: { summary: "string" } },
    },
    checked: {
      control: { type: "boolean" },
      description: "Estado controlado do switch.",
      table: { type: { summary: "boolean" } },
    },
    defaultChecked: {
      control: { type: "boolean" },
      description: "Estado inicial para uso não controlado.",
      table: { type: { summary: "boolean" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "Desabilita interação.",
      table: { type: { summary: "boolean" } },
    },
    onCheckedChange: {
      action: "checkedChange",
      description: "Callback disparado quando o estado do switch muda.",
      table: { type: { summary: "(checked: boolean) => void" } },
    },
    size: {
      control: { type: "inline-radio" },
      options: ["default", "sm"],
      description: "Tamanho visual do switch.",
      table: { type: { summary: "\"default\" | \"sm\"" }, defaultValue: { summary: "default" } },
    },
    variant: {
      control: { type: "inline-radio" },
      options: ["default", "theme-toggle"],
      description: "Variante visual do switch.",
      table: {
        type: { summary: "\"default\" | \"theme-toggle\"" },
        defaultValue: { summary: "default" },
      },
    },
    trackWidth: {
      control: false,
      description:
        "Largura opcional do track (number em px ou string, ex.: `100%`).",
      table: { type: { summary: "number | string" } },
    },
    className: {
      control: false,
      description: "Classe CSS adicional do root do switch.",
      table: { type: { summary: "string" } },
    },
    style: {
      control: false,
      description: "Estilos inline opcionais aplicados ao root.",
      table: { type: { summary: "CSSProperties" } },
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
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Componente `Switch` derivado de shadcn/ui (Radix UI), com tamanhos e variantes para diferentes contextos.",
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

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Switch padrão desligado.",
      },
    },
  },
};

export const Ligado: Story = {
  args: {
    defaultChecked: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Switch inicializado no estado ligado.",
      },
    },
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
        story: "Exemplo da variante `theme-toggle`.",
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
        story: "Exemplo com largura customizada do track.",
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
  parameters: {
    docs: {
      description: {
        story: "Compara estados desabilitados desligado e ligado.",
      },
    },
  },
};

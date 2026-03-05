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
};

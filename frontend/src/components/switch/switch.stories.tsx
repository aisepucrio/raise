import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  argTypes: {
    "aria-label": {
      control: { type: "text" },
      description: "label accessible required for leitores of screen.",
      table: { type: { summary: "string" } },
    },
    checked: {
      control: { type: "boolean" },
      description: "state controlled of the switch.",
      table: { type: { summary: "boolean" } },
    },
    defaultChecked: {
      control: { type: "boolean" },
      description: "state initial for uncontrolled usage.",
      table: { type: { summary: "boolean" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "disables interaction.",
      table: { type: { summary: "boolean" } },
    },
    onCheckedChange: {
      action: "checkedChange",
      description: "Callback triggered when the state of the switch changes.",
      table: { type: { summary: "(checked: boolean) => void" } },
    },
    size: {
      control: { type: "inline-radio" },
      options: ["default", "sm"],
      description: "size visual of the switch.",
      table: { type: { summary: "\"default\" | \"sm\"" }, defaultValue: { summary: "default" } },
    },
    variant: {
      control: { type: "inline-radio" },
      options: ["default", "theme-toggle"],
      description: "Variante visual of the switch.",
      table: {
        type: { summary: "\"default\" | \"theme-toggle\"" },
        defaultValue: { summary: "default" },
      },
    },
    trackWidth: {
      control: false,
      description:
        "Optional track width (number in px or string, for example `100%`).",
      table: { type: { summary: "number | string" } },
    },
    className: {
      control: false,
      description: "Classe CSS adicional of the root of the switch.",
      table: { type: { summary: "string" } },
    },
    style: {
      control: false,
      description: "Estilos inline optional aplicados to root.",
      table: { type: { summary: "CSSProperties" } },
    },
  },
  args: {
    "aria-label": "Ativar option",
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
          "Switch component derived from shadcn/ui (Radix UI), with sizes and variants for different contexts.",
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Switch standard desligado.",
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
        story: "Switch initializado in the state ligado.",
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
        story: "Example of the variante `theme-toggle`.",
      },
    },
  },
};

export const LarguraCustomizada: Story = {
  render: () => (
    <div className="w-52">
      <Switch
        aria-label="Theme toggle with percentage width"
        variant="theme-toggle"
        trackWidth="100%"
        defaultChecked
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example with width customizada of the track.",
      },
    },
  },
};

export const EstadosDesabilitados: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Switch aria-label="disabled desligado" disabled trackWidth={56} />
      <Switch
        aria-label="disabled ligado"
        disabled
        defaultChecked
        trackWidth={56}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Compara states desabilitados desligado and ligado.",
      },
    },
  },
};

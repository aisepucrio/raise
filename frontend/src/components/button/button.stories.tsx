import { ArrowRight, Download, Plus } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    text: {
      control: { type: "text" },
      description: "text shown in the button.",
      table: { type: { summary: "string" } },
    },
    icon: {
      control: false,
      description: "icon optional shown in the button.",
      table: { type: { summary: "ReactNode" } },
    },
    onClick: {
      action: "clicked",
      description: "Callback triggered in the click of the button.",
      table: { type: { summary: "MouseEventHandler<HTMLButtonElement>" } },
    },
    iconSide: {
      control: { type: "inline-radio" },
      options: ["left", "right"],
      description: "Define the lado of the icon when there is text.",
      table: { type: { summary: "\"left\" | \"right\"" }, defaultValue: { summary: "left" } },
    },
    type: {
      control: { type: "inline-radio" },
      options: ["button", "submit", "reset"],
      description: "Tipo nativo of the button.",
      table: { type: { summary: "\"button\" | \"submit\" | \"reset\"" }, defaultValue: { summary: "button" } },
    },
    size: {
      control: { type: "inline-radio" },
      options: ["default", "sm"],
      description: "size visual of the button.",
      table: { type: { summary: "\"default\" | \"sm\"" }, defaultValue: { summary: "default" } },
    },
    fullWidth: {
      control: { type: "boolean" },
      description: "when `true`, occupies width total of the container.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    variant: {
      control: { type: "inline-radio" },
      options: ["default", "selectable"],
      description: "Variante visual of the button.",
      table: { type: { summary: "\"default\" | \"selectable\"" }, defaultValue: { summary: "default" } },
    },
    selected: {
      control: { type: "boolean" },
      description: "state selected (used in the variante `selectable`).",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "disables click and estilo interativo.",
      table: { type: { summary: "boolean" } },
    },
    className: {
      control: false,
      description: "Classe CSS adicional aplieach to button.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    text: "save",
    type: "button",
    iconSide: "left",
  },
  parameters: {
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Reusable button with text, icon, and common states support.",
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
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "button standard with text simple.",
      },
    },
  },
};

export const WithLeftIcon: Story = {
  args: {
    text: "new record",
    icon: <Plus />,
    iconSide: "left",
    "aria-label": "new record",
  },
  parameters: {
    docs: {
      description: {
        story: "button with icon to esquerda and text.",
      },
    },
  },
};

export const WithRightIcon: Story = {
  args: {
    text: "Continuar",
    icon: <ArrowRight />,
    iconSide: "right",
    "aria-label": "Continuar",
  },
  parameters: {
    docs: {
      description: {
        story: "button with icon to direita and text.",
      },
    },
  },
};

export const SomenteIcone: Story = {
  args: {
    text: undefined,
    icon: <Download />,
    "aria-label": "Baixar report",
    title: "Baixar report",
  },
  parameters: {
    docs: {
      description: {
        story:
          "When used without text, set `aria-label` to keep an accessible name.",
      },
    },
  },
};

export const disabled: Story = {
  args: {
    text: "Save changes",
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: "state disabled without interaction of the user.",
      },
    },
  },
};

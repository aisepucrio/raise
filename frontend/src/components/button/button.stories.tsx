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
      description: "Callback triggered on button click.",
      table: { type: { summary: "MouseEventHandler<HTMLButtonElement>" } },
    },
    iconSide: {
      control: { type: "inline-radio" },
      options: ["left", "right"],
      description: "Defines icon side when text is present.",
      table: { type: { summary: "\"left\" | \"right\"" }, defaultValue: { summary: "left" } },
    },
    type: {
      control: { type: "inline-radio" },
      options: ["button", "submit", "reset"],
      description: "Native button type.",
      table: { type: { summary: "\"button\" | \"submit\" | \"reset\"" }, defaultValue: { summary: "button" } },
    },
    size: {
      control: { type: "inline-radio" },
      options: ["default", "sm"],
      description: "Visual button size.",
      table: { type: { summary: "\"default\" | \"sm\"" }, defaultValue: { summary: "default" } },
    },
    fullWidth: {
      control: { type: "boolean" },
      description: "When `true`, occupies full container width.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    variant: {
      control: { type: "inline-radio" },
      options: ["default", "selectable"],
      description: "Visual button variant.",
      table: { type: { summary: "\"default\" | \"selectable\"" }, defaultValue: { summary: "default" } },
    },
    selected: {
      control: { type: "boolean" },
      description: "Selected state (used in `selectable` variant).",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "Disables click and interactive styling.",
      table: { type: { summary: "boolean" } },
    },
    className: {
      control: false,
      description: "Additional CSS class applied to button.",
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
        story: "Default button with simple text.",
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
        story: "Button with left icon and text.",
      },
    },
  },
};

export const WithRightIcon: Story = {
  args: {
    text: "Continue",
    icon: <ArrowRight />,
    iconSide: "right",
    "aria-label": "Continue",
  },
  parameters: {
    docs: {
      description: {
        story: "Button with right icon and text.",
      },
    },
  },
};

export const IconOnly: Story = {
  args: {
    text: undefined,
    icon: <Download />,
    "aria-label": "Download report",
    title: "Download report",
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
        story: "Disabled state with no user interaction.",
      },
    },
  },
};

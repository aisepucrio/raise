import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SelectionButton } from "./selectionButton";

const meta = {
  title: "Components/SelectionButton",
  component: SelectionButton,
  tags: ["autodocs"],
  argTypes: {
    text: {
      control: { type: "text" },
      description: "text shown in the button toggle.",
      table: { type: { summary: "string" } },
    },
    pressed: {
      control: { type: "boolean" },
      description: "state controlled of the button.",
      table: { type: { summary: "boolean" } },
    },
    defaultPressed: {
      control: { type: "boolean" },
      description: "state initial for uncontrolled usage.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    onPressedChange: {
      action: "pressedChange",
      description: "Callback triggered when the state pressed changes.",
      table: { type: { summary: "(pressed: boolean) => void" } },
    },
    size: {
      control: { type: "inline-radio" },
      options: ["default", "sm"],
      description: "size visual of the button.",
      table: { type: { summary: "\"default\" | \"sm\"" }, defaultValue: { summary: "default" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "disables interaction.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    fullWidth: {
      control: { type: "boolean" },
      description: "occupies entire width of the container when enabled.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    className: {
      control: false,
      description: "Classe CSS adicional aplieach to button.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    text: "Issues",
    defaultPressed: false,
    fullWidth: false,
  },
  parameters: {
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Toggle-style selection button for form options.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-6 text-(--color-secondary)">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelectionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "button of selection standard in mode not controlled.",
      },
    },
  },
};

export const PressionadoPorPadrao: Story = {
  args: {
    text: "Commits",
    defaultPressed: true,
  },
  parameters: {
    docs: {
      description: {
        story: "initializa with state pressionado ativo.",
      },
    },
  },
};

export const ControladoExternamente: Story = {
  render: () => {
    const [pressed, setPressed] = useState(false);

    return (
      <div className="flex flex-wrap items-center gap-3">
        <SelectionButton
          text="Pull requests"
          pressed={pressed}
          onPressedChange={setPressed}
          fullWidth={false}
        />

        <button
          type="button"
          onClick={() => setPressed((value) => !value)}
          className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
        >
          Toggle from outside
        </button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Example with state controlled for the component external.",
      },
    },
  },
};

export const GrupoDeSelecao: Story = {
  render: () => (
    <div className="grid gap-2 sm:grid-cols-2">
      <SelectionButton text="Issues" />
      <SelectionButton text="Comments" defaultPressed />
      <SelectionButton text="Pull requests" />
      <SelectionButton text="Commits" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example with multiple buttons for selection for category.",
      },
    },
  },
};

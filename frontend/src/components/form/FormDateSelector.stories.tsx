import type { Meta, StoryObj } from "@storybook/react-vite";
import FormDateSelector from "./FormDateSelector";

const meta = {
  title: "Components/Form/FormDateSelector",
  component: FormDateSelector,
  tags: ["autodocs"],
  argTypes: {
    id: {
      control: { type: "text" },
      description: "Date field ID.",
      table: { type: { summary: "string" } },
    },
    label: {
      control: { type: "text" },
      description: "label shown for the field.",
      table: { type: { summary: "string" } },
    },
    hint: {
      control: { type: "text" },
      description: "Support message shown below field.",
      table: { type: { summary: "string" } },
    },
    error: {
      control: { type: "text" },
      description: "Error message shown below field.",
      table: { type: { summary: "string" } },
    },
    required: {
      control: { type: "boolean" },
      description: "Marks field the required.",
      table: { type: { summary: "boolean" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "disables interaction with the field.",
      table: { type: { summary: "boolean" } },
    },
    min: {
      control: { type: "text" },
      description: "Minimum allowed date in `YYYY-MM-DD` format.",
      table: { type: { summary: "string" } },
    },
    max: {
      control: { type: "text" },
      description: "Maximum allowed date in `YYYY-MM-DD` format.",
      table: { type: { summary: "string" } },
    },
    defaultValue: {
      control: { type: "text" },
      description: "Initial value for uncontrolled usage.",
      table: { type: { summary: "string | number | readonly string[]" } },
    },
    value: {
      control: { type: "text" },
      description: "value controlled of the field.",
      table: { type: { summary: "string | number | readonly string[]" } },
    },
    wrapperClassName: {
      control: false,
      description: "Classe CSS adicional of the wrapper.",
      table: { type: { summary: "string" } },
    },
    labelPosition: {
      control: { type: "inline-radio" },
      options: ["top", "left"],
      description: "Label position relative to field.",
      table: { type: { summary: "\"top\" | \"left\"" }, defaultValue: { summary: "top" } },
    },
    variant: {
      control: { type: "inline-radio" },
      options: ["outlined", "filled"],
      description: "Visual variant of date field.",
      table: { type: { summary: "\"outlined\" | \"filled\"" }, defaultValue: { summary: "outlined" } },
    },
    onChange: {
      action: "changed",
      description: "Callback triggered on date change.",
      table: { type: { summary: "ChangeEventHandler<HTMLInputElement>" } },
    },
  },
  args: {
    id: "form-date-demo",
    label: "Collection Date",
    hint: "Native browser date selector.",
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Date field with label, hint, and error using the same form style.",
      },
    },
  },
} satisfies Meta<typeof FormDateSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Default date field in form style.",
      },
    },
  },
};

export const WithInitialValue: Story = {
  args: {
    id: "form-date-filled",
    defaultValue: "2026-02-25",
    hint: "Filled example.",
  },
  parameters: {
    docs: {
      description: {
        story: "Field pre-filled with an initial date.",
      },
    },
  },
};

export const WithError: Story = {
  args: {
    id: "form-date-error",
    required: true,
    error: "Enter a valid date.",
    hint: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: "Validation state with error message.",
      },
    },
  },
};

export const FilledVariant: Story = {
  args: {
    id: "form-date-filled-variant",
    variant: "filled",
    defaultValue: "2026-02-27",
    hint: "Example using filled variant.",
  },
  parameters: {
    docs: {
      description: {
        story: "Visual example with `filled` variant.",
      },
    },
  },
};

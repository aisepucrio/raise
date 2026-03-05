import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search } from "lucide-react";
import FormInput from "./FormInput";

const meta = {
  title: "Components/Form/FormInput",
  component: FormInput,
  tags: ["autodocs"],
  argTypes: {
    id: {
      control: { type: "text" },
      description: "ID of the input for association with label.",
      table: { type: { summary: "string" } },
    },
    label: {
      control: { type: "text" },
      description: "label shown for the field.",
      table: { type: { summary: "string" } },
    },
    placeholder: {
      control: { type: "text" },
      description: "Placeholder of the input.",
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
    type: {
      control: { type: "text" },
      description: "Native HTML input type.",
      table: { type: { summary: "InputHTMLAttributes<HTMLInputElement>['type']" } },
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
    autoComplete: {
      control: { type: "text" },
      description: "Value for native `autoComplete` attribute.",
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
      description: "Additional CSS class for wrapper.",
      table: { type: { summary: "string" } },
    },
    icon: {
      control: false,
      description: "Optional icon shown inside input.",
      table: { type: { summary: "ReactNode" } },
    },
    iconPosition: {
      control: { type: "inline-radio" },
      options: ["left", "right"],
      description: "Defines icon side inside input.",
      table: { type: { summary: "\"left\" | \"right\"" }, defaultValue: { summary: "left" } },
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
      description: "Visual field variant.",
      table: { type: { summary: "\"outlined\" | \"filled\"" }, defaultValue: { summary: "outlined" } },
    },
    onChange: {
      action: "changed",
      description: "Callback triggered when field value changes.",
      table: { type: { summary: "ChangeEventHandler<HTMLInputElement>" } },
    },
  },
  args: {
    id: "form-input-demo",
    label: "Name",
    placeholder: "Type your name",
    hint: "Default text field.",
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Text field with label, hint, and error using the standard form style.",
      },
    },
  },
} satisfies Meta<typeof FormInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const text: Story = {
  parameters: {
    docs: {
      description: {
        story: "Default text field for simple input.",
      },
    },
  },
};

export const Email: Story = {
  args: {
    id: "form-input-email",
    type: "email",
    label: "Email",
    placeholder: "nome@empresa.with",
    autoComplete: "email",
    hint: "Uses native input attributes.",
  },
  parameters: {
    docs: {
      description: {
        story: "Email setup with proper type and `autoComplete`.",
      },
    },
  },
};

export const WithError: Story = {
  args: {
    id: "form-input-error",
    label: "User",
    required: true,
    error: "Enter a valid user.",
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

export const disabled: Story = {
  args: {
    id: "form-input-disabled",
    label: "Code",
    defaultValue: "STNL-001",
    disabled: true,
    hint: "Disabled state example.",
  },
  parameters: {
    docs: {
      description: {
        story: "Disabled field for read-only display.",
      },
    },
  },
};

export const FilledVariant: Story = {
  args: {
    id: "form-input-filled",
    label: "Search",
    placeholder: "Search by repository",
    variant: "filled",
    hint: "Filled variant example.",
  },
  parameters: {
    docs: {
      description: {
        story: "Visual example of the `filled` variant.",
      },
    },
  },
};

export const WithIcon: Story = {
  args: {
    id: "form-input-icon",
    label: "Search",
    placeholder: "Type...",
    icon: <Search className="size-4" />,
    hint: "Example with optional icon.",
  },
  parameters: {
    docs: {
      description: {
        story: "Field with decorative icon inside input.",
      },
    },
  },
};

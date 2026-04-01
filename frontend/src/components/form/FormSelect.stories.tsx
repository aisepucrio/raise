import type { Meta, StoryObj } from "@storybook/react-vite";
import FormSelect from "./FormSelect";

const meta = {
  title: "Components/Form/FormSelect",
  component: FormSelect,
  tags: ["autodocs"],
  argTypes: {
    id: {
      control: { type: "text" },
      description: "ID of the select for association with label.",
      table: { type: { summary: "string" } },
    },
    label: {
      control: { type: "text" },
      description: "Label shown above the field.",
      table: { type: { summary: "string" } },
    },
    hint: {
      control: { type: "text" },
      description: "Support message shown below the field.",
      table: { type: { summary: "string" } },
    },
    error: {
      control: { type: "text" },
      description: "Error message shown below the field.",
      table: { type: { summary: "string" } },
    },
    required: {
      control: { type: "boolean" },
      description: "Marks the field as required.",
      table: { type: { summary: "boolean" } },
    },
    defaultValue: {
      control: { type: "text" },
      description: "Initial value for uncontrolled usage.",
      table: { type: { summary: "string | number | readonly string[]" } },
    },
    value: {
      control: { type: "text" },
      description: "Controlled select value.",
      table: { type: { summary: "string | number | readonly string[]" } },
    },
    children: {
      control: false,
      description: "Options (`<option>`) rendered inside the select.",
      table: { type: { summary: "ReactNode" } },
    },
    wrapperClassName: {
      control: false,
      description: "Additional CSS class for the wrapper.",
      table: { type: { summary: "string" } },
    },
    labelPosition: {
      control: { type: "inline-radio" },
      options: ["top", "left"],
      description: "position of the label in relation to field.",
      table: { type: { summary: "\"top\" | \"left\"" }, defaultValue: { summary: "top" } },
    },
    variant: {
      control: { type: "inline-radio" },
      options: ["outlined", "filled"],
      description: "Visual select variant.",
      table: { type: { summary: "\"outlined\" | \"filled\"" }, defaultValue: { summary: "outlined" } },
    },
    onChange: {
      action: "changed",
      description: "Callback triggered to change the option selected.",
      table: { type: { summary: "ChangeEventHandler<HTMLSelectElement>" } },
    },
  },
  args: {
    id: "form-select-demo",
    label: "source",
    defaultValue: "",
    hint: "Select with animated icon and standard states.",
    children: (
      <>
        <option value="" disabled>
          Select an option
        </option>
        <option value="github">GitHub</option>
        <option value="jira">Jira</option>
        <option value="stackoverflow">Stack Overflow</option>
      </>
    ),
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Select field with the same visual and validation standard as other form fields.",
      },
    },
  },
} satisfies Meta<typeof FormSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Default select with source options.",
      },
    },
  },
};

export const RequiredWithError: Story = {
  args: {
    id: "form-select-error",
    required: true,
    error: "Select a source.",
    hint: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: "Validation state with required field and error message.",
      },
    },
  },
};

export const Preselected: Story = {
  args: {
    id: "form-select-selected",
    defaultValue: "jira",
    hint: "Example with initial value.",
  },
  parameters: {
    docs: {
      description: {
        story: "Displays select with initial value already selected.",
      },
    },
  },
};

export const FilledVariant: Story = {
  args: {
    id: "form-select-filled",
    defaultValue: "github",
    variant: "filled",
    hint: "Example using the filled variant.",
  },
  parameters: {
    docs: {
      description: {
        story: "Visual example with `filled` variant.",
      },
    },
  },
};

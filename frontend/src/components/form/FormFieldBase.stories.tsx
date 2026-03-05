import type { Meta, StoryObj } from "@storybook/react-vite";
import FormFieldBase, { getFormControlClassName } from "./FormFieldBase";

const meta = {
  title: "Components/Form/FormFieldBase",
  component: FormFieldBase,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: { type: "text" },
      description: "Label text shown above or beside field.",
      table: { type: { summary: "string" } },
    },
    htmlFor: {
      control: { type: "text" },
      description: "Field ID associated with label.",
      table: { type: { summary: "string" } },
    },
    hint: {
      control: { type: "text" },
      description: "Support message shown below field.",
      table: { type: { summary: "string" } },
    },
    error: {
      control: { type: "text" },
      description: "Error message (replaces hint when present).",
      table: { type: { summary: "string" } },
    },
    required: {
      control: { type: "boolean" },
      description: "Marks field the required in label.",
      table: { type: { summary: "boolean" } },
    },
    labelPosition: {
      control: { type: "inline-radio" },
      options: ["top", "left"],
      description: "Visual label position relative to content.",
      table: { type: { summary: "\"top\" | \"left\"" }, defaultValue: { summary: "top" } },
    },
    className: {
      control: false,
      description: "Additional CSS class for wrapper.",
      table: { type: { summary: "string" } },
    },
    children: {
      control: false,
      description: "Field element rendered inside container.",
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    label: "Field Name",
    htmlFor: "field-base-demo",
    hint: "Use this container to standardize label, hint, and error.",
    required: false,
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Base component to organize label, field content, and support or error messages.",
      },
    },
  },
  render: (args) => (
    <FormFieldBase {...args}>
      <input
        id={args.htmlFor}
        className={getFormControlClassName("outlined")}
        placeholder="Field rendered as child"
      />
    </FormFieldBase>
  ),
} satisfies Meta<typeof FormFieldBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHint: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Base example with label and support message.",
      },
    },
  },
};

export const WithError: Story = {
  args: {
    hint: undefined,
    error: "This field is required.",
    required: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows error state with required field indicator.",
      },
    },
  },
};

export const WithoutLabel: Story = {
  args: {
    label: undefined,
    htmlFor: undefined,
    hint: "Also works without label for specific layouts.",
  },
  parameters: {
    docs: {
      description: {
        story: "Usage without label for custom layout compositions.",
      },
    },
  },
};

export const OutlinedVsFilled: Story = {
  args: {
    label: undefined,
    htmlFor: undefined,
    hint: undefined,
    error: undefined,
  },
  render: () => (
    <div className="grid max-w-md gap-4">
      <FormFieldBase label="Outlined" htmlFor="field-base-outlined">
        <input
          id="field-base-outlined"
          className={getFormControlClassName("outlined")}
          placeholder="Outlined variant"
        />
      </FormFieldBase>

      <FormFieldBase label="Filled" htmlFor="field-base-filled">
        <input
          id="field-base-filled"
          className={getFormControlClassName("filled")}
          placeholder="Filled variant"
        />
      </FormFieldBase>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Visual comparison between `outlined` and `filled` field styles.",
      },
    },
  },
};

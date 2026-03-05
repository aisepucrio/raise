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
      description: "label shown above of the field.",
      table: { type: { summary: "string" } },
    },
    hint: {
      control: { type: "text" },
      description: "Support message shown below the field.",
      table: { type: { summary: "string" } },
    },
    error: {
      control: { type: "text" },
      description: "message of error shown below of the field.",
      table: { type: { summary: "string" } },
    },
    required: {
      control: { type: "boolean" },
      description: "Marca the field how required.",
      table: { type: { summary: "boolean" } },
    },
    defaultValue: {
      control: { type: "text" },
      description: "value initial for uncontrolled usage.",
      table: { type: { summary: "string | number | readonly string[]" } },
    },
    value: {
      control: { type: "text" },
      description: "value controlled of the select.",
      table: { type: { summary: "string | number | readonly string[]" } },
    },
    children: {
      control: false,
      description: "options (`<option>`) renderizadas inside of the select.",
      table: { type: { summary: "ReactNode" } },
    },
    wrapperClassName: {
      control: false,
      description: "Classe CSS adicional of the wrapper.",
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
      description: "Variante visual of the select.",
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
    hint: "Select with icon animatestesdo and states standard.",
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
        story: "Select standard with options of source.",
      },
    },
  },
};

export const ObrigatorioComErro: Story = {
  args: {
    id: "form-select-error",
    required: true,
    error: "Select a source.",
    hint: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: "state of validation with field required and error.",
      },
    },
  },
};

export const PreSelecionado: Story = {
  args: {
    id: "form-select-selected",
    defaultValue: "jira",
    hint: "Example with value initial.",
  },
  parameters: {
    docs: {
      description: {
        story: "displays select with value initial already selected.",
      },
    },
  },
};

export const FilledVariant: Story = {
  args: {
    id: "form-select-filled",
    defaultValue: "github",
    variant: "filled",
    hint: "Example with the variante filled.",
  },
  parameters: {
    docs: {
      description: {
        story: "Example visual with variante `filled`.",
      },
    },
  },
};

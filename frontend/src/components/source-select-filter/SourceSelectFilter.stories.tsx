import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SourceSelectFilter } from "./SourceSelectFilter";

function InteractiveDemo() {
  const [selectedValue, setSelectedValue] = useState("");

  return (
    <div className="space-y-3">
      <SourceSelectFilter
        id="storybook-source-select"
        label="Repository"
        value={selectedValue}
        onChange={setSelectedValue}
        options={[
          { value: "1", label: "acme/api" },
          { value: "2", label: "acme/web" },
        ]}
        allOptionLabel="All repositories"
        wrapperClassName="w-full min-w-56"
        className="font-semibold"
      />

      <div className="rounded-md border border-(--color-secondary-subtle) px-3 py-2 text-sm text-(--color-secondary-muted)">
        selected={selectedValue || "(all)"}
      </div>
    </div>
  );
}

const meta = {
  title: "Components/SourceSelectFilter",
  component: SourceSelectFilter,
  tags: ["autodocs"],
  argTypes: {
    id: {
      control: { type: "text" },
      description: "ID of the select field.",
      table: { type: { summary: "string" } },
    },
    label: {
      control: { type: "text" },
      description: "Label shown above the select.",
      table: { type: { summary: "string" } },
    },
    value: {
      control: { type: "text" },
      description: "Currently selected value.",
      table: { type: { summary: "string" } },
    },
    onChange: {
      control: false,
      description: "Callback called when the option selected changes.",
      table: { type: { summary: "(value: string) => void" } },
    },
    options: {
      control: false,
      description: "list of options available for selection.",
      table: { type: { summary: "{ value: string; label: string }[]" } },
    },
    allOptionLabel: {
      control: { type: "text" },
      description: "Text of the neutral option (all items).",
      table: { type: { summary: "string" } },
    },
    isOptionsPending: {
      control: { type: "boolean" },
      description: "Indicates options loading state.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    wrapperClassName: {
      control: false,
      description: "Additional CSS class for field wrapper.",
      table: { type: { summary: "string" } },
    },
    className: {
      control: false,
      description: "Additional CSS class applied to select.",
      table: { type: { summary: "string" } },
    },
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Select to choose a source inside a filters row.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SourceSelectFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: "Demonstrates source selection with selected-value feedback.",
      },
    },
  },
};

export const LoadingOptions: Story = {
  args: {
    id: "storybook-source-select-pending",
    label: "Project",
    value: "",
    onChange: () => undefined,
    options: [],
    allOptionLabel: "All projects",
    isOptionsPending: true,
  },
  parameters: {
    docs: {
      description: {
        story: "State with empty list while loading is in progress.",
      },
    },
  },
};

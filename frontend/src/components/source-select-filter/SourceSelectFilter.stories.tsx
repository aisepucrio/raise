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
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Select reutilizável de source (repository/project/etc) para linhas de filtro do overview e preview.",
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

export const Padrao: Story = {
  render: () => <InteractiveDemo />,
};

export const CarregandoOpcoes: Story = {
  args: {
    id: "storybook-source-select-pending",
    label: "Project",
    value: "",
    onChange: () => undefined,
    options: [],
    allOptionLabel: "All projects",
    isOptionsPending: true,
  },
};

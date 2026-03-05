import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchBar } from "./SearchBar";

function InteractiveDemo({ expandable = false }: { expandable?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-3">
      <div className="w-full max-w-3xl">
        <SearchBar
          id="storybook-search-bar"
          onSearchChange={setSearchTerm}
          expandable={expandable}
        />
      </div>

      <div className="rounded-md border border-(--color-secondary-subtle) px-3 py-2 text-sm text-(--color-secondary-muted)">
        Debounced search: {searchTerm || "(empty)"}
      </div>
    </div>
  );
}

const meta = {
  title: "Components/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
  argTypes: {
    id: {
      control: { type: "text" },
      description: "ID of the field of search.",
      table: { type: { summary: "string" } },
    },
    onSearchChange: {
      control: false,
      description: "Callback triggered after debounce of the termo digitado.",
      table: { type: { summary: "(searchTerm: string) => void" } },
    },
    label: {
      control: { type: "text" },
      description: "Label of the field of search.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Search" } },
    },
    placeholder: {
      control: { type: "text" },
      description: "Placeholder of the input of search.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Type..." } },
    },
    debounceMs: {
      control: { type: "number" },
      description: "Tempo of debounce (ms) antes of trigger `onSearchChange`.",
      table: { type: { summary: "number" }, defaultValue: { summary: "350" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "disables interaction with the search.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    expandable: {
      control: { type: "boolean" },
      description: "Ativa expansion horizontal of the field to focar ou digitar.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "bar de fetches com debounce interno e option de modo expandable.",
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
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: "search standard with feedback of the termo aplicado after debounce.",
      },
    },
  },
};

export const Expandivel: Story = {
  render: () => <InteractiveDemo expandable />,
  parameters: {
    docs: {
      description: {
        story: "search in mode expandable for save space in the layout.",
      },
    },
  },
};

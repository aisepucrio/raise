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
      description: "ID of the search field.",
      table: { type: { summary: "string" } },
    },
    onSearchChange: {
      control: false,
      description: "Callback triggered after debounce of the typed term.",
      table: { type: { summary: "(searchTerm: string) => void" } },
    },
    label: {
      control: { type: "text" },
      description: "Label of the search field.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Search" } },
    },
    placeholder: {
      control: { type: "text" },
      description: "Search input placeholder.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Type..." } },
    },
    debounceMs: {
      control: { type: "number" },
      description: "Debounce time (ms) before triggering `onSearchChange`.",
      table: { type: { summary: "number" }, defaultValue: { summary: "350" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "disables interaction with the search.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    expandable: {
      control: { type: "boolean" },
      description: "Enables horizontal expansion while focusing/typing.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Search bar with internal debounce and optional expandable mode.",
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
        story: "Standard search with debounced applied-term feedback.",
      },
    },
  },
};

export const Expandable: Story = {
  render: () => <InteractiveDemo expandable />,
  parameters: {
    docs: {
      description: {
        story: "Expandable search mode to save layout space.",
      },
    },
  },
};

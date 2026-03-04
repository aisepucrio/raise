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
    onSearchChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Barra de busca com debounce interno e opção de modo expansível.",
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

export const Padrao: Story = {
  render: () => <InteractiveDemo />,
};

export const Expandivel: Story = {
  render: () => <InteractiveDemo expandable />,
};

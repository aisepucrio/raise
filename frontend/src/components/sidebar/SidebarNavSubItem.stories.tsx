import type { Meta, StoryObj } from "@storybook/react-vite";
import SidebarNavSubItem from "./SidebarNavSubItem";

const noop = () => undefined;

const meta = {
  title: "Components/Sidebar/SidebarNavSubItem",
  component: SidebarNavSubItem,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: { type: "text" },
      description: "text shown in the subitem.",
      table: { type: { summary: "string" } },
    },
    active: {
      control: { type: "boolean" },
      description: "Indicates whether the subitem represents the current route.",
      table: { type: { summary: "boolean" } },
    },
    onClick: {
      action: "clicked",
      description: "Callback triggered in the click of the subitem.",
      table: { type: { summary: "() => void" } },
    },
  },
  args: {
    label: "Summary",
    active: false,
    onClick: noop,
  },
  parameters: {
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Sidebar navigation subitem for hierarchical lists.",
      },
    },
  },
  decorators: [
    (Story) => (
      <aside className="w-72 border-r-2 border-(--color-secondary-soft) p-6">
        <nav className="flex flex-col gap-1">
          <Story />
        </nav>
      </aside>
    ),
  ],
} satisfies Meta<typeof SidebarNavSubItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Default subitem in inactive state.",
      },
    },
  },
};

export const Active: Story = {
  args: {
    active: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Active state with visual highlight in navigation.",
      },
    },
  },
};

export const LongLabel: Story = {
  args: {
    label: "General summary of the selected integration collection",
  },
  parameters: {
    docs: {
      description: {
        story: "Compares truncation behavior with a long label.",
      },
    },
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Briefcase, Download, Eye, Home } from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";

const iconOptions = {
  Home,
  Preview: Eye,
  Collect: Download,
  Jobs: Briefcase,
};
const noop = () => undefined;

const meta = {
  title: "Components/Sidebar/SidebarNavItem",
  component: SidebarNavItem,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: { type: "text" },
      description: "Main text of the sidebar item.",
      table: { type: { summary: "string" } },
    },
    active: {
      control: { type: "boolean" },
      description: "Marks the item as active.",
      table: { type: { summary: "boolean" } },
    },
    onClick: {
      action: "clicked",
      description: "Callback triggered in the click when there are no subitems.",
      table: { type: { summary: "() => void" } },
    },
    subItems: {
      control: false,
      description:
        "Optional subitems list for hierarchical display.",
      table: { type: { summary: "{ label: string; active: boolean; onClick: () => void }[]" } },
    },
    defaultExpanded: {
      control: "boolean",
      description: "Defines initial expansion state.",
      table: { type: { summary: "boolean" } },
    },
    icon: {
      control: { type: "select" },
      options: Object.keys(iconOptions),
      mapping: iconOptions,
      description: "Lucide icon shown to the left of the label.",
      table: { type: { summary: "LucideIcon" } },
    },
  },
  args: {
    label: "Overview",
    active: false,
    icon: Home,
    onClick: noop,
    defaultExpanded: false,
  },
  parameters: {
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Main sidebar navigation item with icon, active state, and optional subitems.",
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
} satisfies Meta<typeof SidebarNavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Default navigation item without subitems.",
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
        story: "Shows visual highlight for active state.",
      },
    },
  },
};

export const LongLabel: Story = {
  args: {
    label: "configurations and preferences of integration",
    icon: Briefcase,
  },
  parameters: {
    docs: {
      description: {
        story: "Compares layout behavior with a long label.",
      },
    },
  },
};

export const WithSubitems: Story = {
  args: {
    label: "Preview",
    icon: Eye,
    active: false,
    defaultExpanded: false,
    subItems: [
      { label: "Summary", active: true, onClick: noop },
      { label: "Details", active: false, onClick: noop },
      { label: "History", active: false, onClick: noop },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Shows expandable behavior when subitems exist.",
      },
    },
  },
};

export const InContext: Story = {
  render: () => {
    return (
      <>
        <SidebarNavItem
          label="Overview"
          icon={Home}
          active={false}
          onClick={noop}
        />
        <SidebarNavItem
          label="Preview"
          icon={Eye}
          active={true}
          onClick={noop}
        />
        <SidebarNavItem
          label="Collect"
          icon={Download}
          active={false}
          onClick={noop}
        />
        <SidebarNavItem
          label="Jobs"
          icon={Briefcase}
          active={false}
          onClick={noop}
        />
        <SidebarNavItem
          label="Preview"
          icon={Eye}
          active={false}
          subItems={[
            { label: "Summary", active: false, onClick: noop },
            { label: "Details", active: true, onClick: noop },
          ]}
        />
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Example with multiple items to compare visual states.",
      },
    },
  },
};

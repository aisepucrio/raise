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
    onClick: { action: "clicked" },
    icon: {
      control: { type: "select" },
      options: Object.keys(iconOptions),
      mapping: iconOptions,
      description: "Ícone Lucide exibido à esquerda do rótulo.",
    },
  },
  args: {
    label: "Overview",
    active: false,
    icon: Home,
    onClick: noop,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Item de navegação da sidebar com estados `active`/hover, ícone e `aria-current` quando representa a rota atual.",
      },
    },
  },
  decorators: [
    (Story) => (
      <aside className="w-72 border-r-2 border-(--color-sidebar-border) p-6">
        <nav className="flex flex-col gap-1">
          <Story />
        </nav>
      </aside>
    ),
  ],
} satisfies Meta<typeof SidebarNavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const Ativo: Story = {
  args: {
    active: true,
  },
};

export const RotuloLongo: Story = {
  args: {
    label: "Configurações e preferências de integração",
    icon: Briefcase,
  },
};

export const EmContexto: Story = {
  render: () => {
    return (
      <>
        <SidebarNavItem
          label="Overview"
          icon={Home}
          active={false}
          onClick={noop}
        />
        <SidebarNavItem label="Preview" icon={Eye} active={true} onClick={noop} />
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
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Exemplo de composição dentro de um `nav`, mostrando o comportamento visual do item ativo em relação aos demais.",
      },
    },
  },
};

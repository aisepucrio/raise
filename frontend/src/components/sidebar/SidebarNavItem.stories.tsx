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
    subItems: {
      control: false,
      description:
        "Lista opcional de subitens para exibição hierárquica.",
    },
    defaultExpanded: {
      control: "boolean",
      description: "Define o estado inicial de expansão.",
    },
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
    defaultExpanded: false,
  },
  parameters: {
    wrapperSize: "small",
    docs: {
      description: {
        component:
          "Item principal da navegação da sidebar, com ícone, estado ativo e subitens opcionais.",
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

export const ComSubitens: Story = {
  args: {
    label: "Preview",
    icon: Eye,
    active: false,
    defaultExpanded: false,
    subItems: [
      { label: "Resumo", active: true, onClick: noop },
      { label: "Detalhes", active: false, onClick: noop },
      { label: "Histórico", active: false, onClick: noop },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Mostra o comportamento expansível quando existem subitens.",
      },
    },
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
            { label: "Resumo", active: false, onClick: noop },
            { label: "Detalhes", active: true, onClick: noop },
          ]}
        />
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Exemplo com vários itens para comparar os estados visuais.",
      },
    },
  },
};

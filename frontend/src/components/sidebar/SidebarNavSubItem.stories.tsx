import type { Meta, StoryObj } from "@storybook/react-vite";
import SidebarNavSubItem from "./SidebarNavSubItem";

const noop = () => undefined;

const meta = {
  title: "Components/Sidebar/SidebarNavSubItem",
  component: SidebarNavSubItem,
  tags: ["autodocs"],
  argTypes: {
    onClick: { action: "clicked" },
  },
  args: {
    label: "Resumo",
    active: false,
    onClick: noop,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Subitem de navegação para listas hierárquicas da sidebar.",
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

export const Padrao: Story = {};

export const Ativo: Story = {
  args: {
    active: true,
  },
};

export const RotuloLongo: Story = {
  args: {
    label: "Resumo geral da coleta da integração selecionada",
  },
};

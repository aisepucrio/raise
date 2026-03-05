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
      description: "Texto exibido no subitem.",
      table: { type: { summary: "string" } },
    },
    active: {
      control: { type: "boolean" },
      description: "Indica se o subitem representa a rota atual.",
      table: { type: { summary: "boolean" } },
    },
    onClick: {
      action: "clicked",
      description: "Callback disparado no clique do subitem.",
      table: { type: { summary: "() => void" } },
    },
  },
  args: {
    label: "Resumo",
    active: false,
    onClick: noop,
  },
  parameters: {
    wrapperSize: "small",
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

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Subitem padrão em estado inativo.",
      },
    },
  },
};

export const Ativo: Story = {
  args: {
    active: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Estado ativo com destaque visual na navegação.",
      },
    },
  },
};

export const RotuloLongo: Story = {
  args: {
    label: "Resumo geral da coleta da integração selecionada",
  },
  parameters: {
    docs: {
      description: {
        story: "Compara truncamento/comportamento com rótulo longo.",
      },
    },
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";

import { InfoBoxGrid } from "./";

const storyWrapperClassName =
  "rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)";

const baseItems = [
  { title: "Processados", number: 128 },
  { title: "Em fila", number: 42 },
  { title: "Falhas", number: 7 },
  { title: "Cancelados", number: 3 },
];

const meta = {
  title: "Components/InfoBoxGrid",
  component: InfoBoxGrid,
  tags: ["autodocs"],
  argTypes: {
    items: {
      control: false,
      description: "Lista de cards com título, valor e cor opcional.",
      table: { type: { summary: "InfoBoxGridItem[]" } },
    },
    className: {
      control: false,
      description: "Classe CSS adicional aplicada no grid.",
      table: { type: { summary: "string" } },
    },
    style: {
      control: false,
      description: "Estilos inline opcionais aplicados no container.",
      table: { type: { summary: "CSSProperties" } },
    },
  },
  args: {
    items: baseItems,
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Grid responsivo para exibir múltiplos cards de métrica.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className={storyWrapperClassName}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InfoBoxGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PadraoZebrado: Story = {
  parameters: {
    docs: {
      description: {
        story: "Grid padrão com alternância automática de cores (zebra).",
      },
    },
  },
};

export const ComCoresExplicitas: Story = {
  args: {
    items: [
      { title: "Processados", number: 128, color: "secondary" },
      { title: "Em fila", number: 42, color: "secondary" },
      { title: "Falhas", number: 7, color: "primary" },
      { title: "Cancelados", number: 3, color: "primary" },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Quando a cor é definida no item, ela é usada diretamente.",
      },
    },
  },
};

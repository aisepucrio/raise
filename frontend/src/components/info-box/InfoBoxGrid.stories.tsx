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
      description: "list of cards with title, value and color optional.",
      table: { type: { summary: "InfoBoxGridItem[]" } },
    },
    className: {
      control: false,
      description: "Classe CSS adicional aplieach in the grid.",
      table: { type: { summary: "string" } },
    },
    style: {
      control: false,
      description: "Estilos inline optional aplicados in the container.",
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
          "Responsive grid to display multiple metric cards.",
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

export const DefaultZebra: Story = {
  parameters: {
    docs: {
      description: {
        story: "Grid standard with alternation automatic of cores (zebra).",
      },
    },
  },
};

export const WithExplicitColors: Story = {
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
        story: "when the color is definida in the item, ela is used diretamente.",
      },
    },
  },
};

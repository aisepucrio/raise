import type { Meta, StoryObj } from "@storybook/react-vite";

import { InfoBoxGrid } from "./";

const storyWrapperClassName =
  "rounded-xl border border-(--color-sidebar-border) bg-(--color-app-bg) p-4 text-(--color-app-fg)";

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
    items: { control: false },
  },
  args: {
    items: baseItems,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Grid responsivo para agrupar `InfoBox` com gap/padding padronizados e cores em zebra por padrão (vertical em telas pequenas e em múltiplas colunas em telas maiores).",
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

export const PadraoZebrado: Story = {};

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
        story:
          "Quando `color` é informado em um item, o grid respeita a cor explícita e não aplica zebra naquele card.",
      },
    },
  },
};

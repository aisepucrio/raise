import type { Meta, StoryObj } from "@storybook/react-vite";

import { Loader } from "./loader";

const meta = {
  title: "Components/Loader",
  component: Loader,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Indicador de carregamento centralizado que se adapta ao tamanho do contêiner.",
      },
    },
  },
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => (
    <div className="h-36 rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4">
      <Loader />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Exemplo básico de uso em uma área de carregamento.",
      },
    },
  },
};

export const ResizePorContainer: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="h-20 rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-2">
        <Loader />
      </div>
      <div className="h-32 rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-2">
        <Loader />
      </div>
      <div className="h-52 rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-2">
        <Loader />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mostra o comportamento em contêineres com tamanhos diferentes.",
      },
    },
  },
};

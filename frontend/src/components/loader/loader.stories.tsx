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
          "Loader padrão para qualquer interface de carregamento, centralizado no contêiner pai, com resize simples via `clamp(...)` ",
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
        story:
          "Uso comum em uma área de carregamento: o loader ocupa o espaço do pai e permanece centralizado.",
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
        story:
          "Mostra o resize simples com `clamp(...)` conforme o tamanho do contêiner, mantendo centralização.",
      },
    },
  },
};

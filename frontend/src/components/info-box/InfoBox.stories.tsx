import type { Meta, StoryObj } from "@storybook/react-vite";

import { InfoBox } from "./";

const storyWrapperClassName =
  "rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)";

const meta = {
  title: "Components/InfoBox",
  component: InfoBox,
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: { type: "inline-radio" },
      options: ["primary", "secondary"],
    },
  },
  args: {
    title: "Jobs processados",
    number: 128,
    color: "primary",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Card para exibir uma métrica com título e valor.",
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
} satisfies Meta<typeof InfoBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const Secundario: Story = {
  args: {
    title: "Jobs em fila",
    number: 42,
    color: "secondary",
  },
};

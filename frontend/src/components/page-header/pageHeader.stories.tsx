import type { Meta, StoryObj } from "@storybook/react-vite";

import { PageHeader } from "./pageHeader";

const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: { type: "text" },
      description: "Título principal da página.",
      table: { type: { summary: "string" } },
    },
    subtitle: {
      control: { type: "text" },
      description: "Descrição complementar exibida abaixo do título.",
      table: { type: { summary: "string" } },
    },
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Cabeçalho de página com título, subtítulo e separador inferior.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-6 text-(--color-secondary)">
        <Story />
      </div>
    ),
  ],
  args: {
    title: "Jobs",
    subtitle:
      "Monitor collection jobs, inspect raw records, and run simple retry/stop actions.",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Cabeçalho padrão com título e subtítulo curtos.",
      },
    },
  },
};

export const TextoLongo: Story = {
  args: {
    title: "Preview",
    subtitle:
      "Inspect records returned by the selected source and section before exporting or validating downstream transformations.",
  },
  parameters: {
    docs: {
      description: {
        story: "Valida comportamento visual com texto mais longo no subtítulo.",
      },
    },
  },
};

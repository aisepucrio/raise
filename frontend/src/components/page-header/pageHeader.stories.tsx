import type { Meta, StoryObj } from "@storybook/react-vite";

import { PageHeader } from "./pageHeader";

const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: { type: "text" },
      description: "Main page title.",
      table: { type: { summary: "string" } },
    },
    subtitle: {
      control: { type: "text" },
      description: "Complementary description shown below title.",
      table: { type: { summary: "string" } },
    },
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Page header with title, subtitle, and bottom separator.",
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Default header with short title and subtitle.",
      },
    },
  },
};

export const LongText: Story = {
  args: {
    title: "Preview",
    subtitle:
      "Inspect records returned by the selected source and section before exporting or validating downstream transformations.",
  },
  parameters: {
    docs: {
      description: {
        story: "Validates visual behavior with longer subtitle text.",
      },
    },
  },
};

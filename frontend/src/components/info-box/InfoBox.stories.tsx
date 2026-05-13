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
      description: "Card visual variant.",
      table: { type: { summary: "\"primary\" | \"secondary\"" }, defaultValue: { summary: "primary" } },
    },
    title: {
      control: { type: "text" },
      description: "title shown in the card.",
      table: { type: { summary: "string" } },
    },
    number: {
      control: { type: "text" },
      description: "Main metric value.",
      table: { type: { summary: "number | string" } },
    },
    className: {
      control: false,
      description: "Additional CSS class applied to the card.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    title: "Processed Jobs",
    number: 128,
    color: "primary",
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Card to display a metric with title and value.",
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Metric card with primary style.",
      },
    },
  },
};

export const Secondary: Story = {
  args: {
    title: "Jobs in Queue",
    number: 42,
    color: "secondary",
  },
  parameters: {
    docs: {
      description: {
        story: "Same structure using secondary visual variant.",
      },
    },
  },
};

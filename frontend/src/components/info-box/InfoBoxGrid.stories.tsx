import type { Meta, StoryObj } from "@storybook/react-vite";

import { InfoBoxGrid } from "./";

const storyWrapperClassName =
  "rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4 text-(--color-secondary)";

const baseItems = [
  { title: "Processed", number: 128 },
  { title: "In Queue", number: 42 },
  { title: "Failures", number: 7 },
  { title: "Canceled", number: 3 },
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
      description: "Additional CSS class applied to the grid.",
      table: { type: { summary: "string" } },
    },
    style: {
      control: false,
      description: "Optional inline styles applied to the container.",
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
        story: "Standard grid with automatic zebra color alternation.",
      },
    },
  },
};

export const WithExplicitColors: Story = {
  args: {
    items: [
      { title: "Processed", number: 128, color: "secondary" },
      { title: "In Queue", number: 42, color: "secondary" },
      { title: "Failures", number: 7, color: "primary" },
      { title: "Canceled", number: 3, color: "primary" },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "When color is defined on the item, it is used directly.",
      },
    },
  },
};

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  CollectDateSection,
  type CollectDateSectionProps,
} from "./CollectDateSection";

function CollectDateSectionDemo(args: CollectDateSectionProps) {
  const [startDate, setStartDate] = useState(args.startDate);
  const [endDate, setEndDate] = useState(args.endDate);

  return (
    <CollectDateSection
      {...args}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
    />
  );
}

const meta = {
  title: "Components/Collect/CollectDateSection",
  component: CollectDateSection,
  tags: ["autodocs"],
  argTypes: {
    startDate: {
      control: { type: "text" },
      description: "Start date in `YYYY-MM-DD` format.",
      table: { type: { summary: "string" } },
    },
    endDate: {
      control: { type: "text" },
      description: "End date in `YYYY-MM-DD` format.",
      table: { type: { summary: "string" } },
    },
    onStartDateChange: {
      action: "startDateChange",
      description: "Callback triggered to change start date.",
      table: { type: { summary: "(value: string) => void" } },
    },
    onEndDateChange: {
      action: "endDateChange",
      description: "Callback triggered to change end date.",
      table: { type: { summary: "(value: string) => void" } },
    },
    dateFilterIdPrefix: {
      control: { type: "text" },
      description: "Prefix used to generate internal filter IDs.",
      table: { type: { summary: "string" } },
    },
    dateWarningMessage: {
      control: { type: "text" },
      description: "message shown when period is empty.",
      table: { type: { summary: "string" } },
    },
    startLabel: {
      control: { type: "text" },
      description: "Label of the start-date field.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Start" } },
    },
    endLabel: {
      control: { type: "text" },
      description: "Label of the end-date field.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Finish" } },
    },
  },
  args: {
    startDate: "",
    endDate: "",
    dateFilterIdPrefix: "storybook-collect-date",
    dateWarningMessage: "Start and finish dates are required.",
    startLabel: "Start",
    endLabel: "Finish",
    onStartDateChange: () => undefined,
    onEndDateChange: () => undefined,
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Period section with initial/final date selection and optional warning.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CollectDateSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithWarning: Story = {
  render: (args) => <CollectDateSectionDemo {...args} />,
  parameters: {
    docs: {
      description: {
        story: "Initial state with empty dates and warning visible.",
      },
    },
  },
};

export const WithFilledDates: Story = {
  render: (args) => <CollectDateSectionDemo {...args} />,
  args: {
    startDate: "2026-01-10",
    endDate: "2026-01-31",
  },
  parameters: {
    docs: {
      description: {
        story: "State with complete period and no warning displayed.",
      },
    },
  },
};

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
      description: "date initial in the format `YYYY-MM-DD`.",
      table: { type: { summary: "string" } },
    },
    endDate: {
      control: { type: "text" },
      description: "end date in the format `YYYY-MM-DD`.",
      table: { type: { summary: "string" } },
    },
    onStartDateChange: {
      action: "startDateChange",
      description: "Callback triggered to change date initial.",
      table: { type: { summary: "(value: string) => void" } },
    },
    onEndDateChange: {
      action: "endDateChange",
      description: "Callback triggered to change end date.",
      table: { type: { summary: "(value: string) => void" } },
    },
    dateFilterIdPrefix: {
      control: { type: "text" },
      description: "Prefixed used for gerar IDs internos of the filter.",
      table: { type: { summary: "string" } },
    },
    dateWarningMessage: {
      control: { type: "text" },
      description: "message shown when period is empty.",
      table: { type: { summary: "string" } },
    },
    startLabel: {
      control: { type: "text" },
      description: "label of the field of date initial.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Start" } },
    },
    endLabel: {
      control: { type: "text" },
      description: "label of the field of end date.",
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
        story: "state initial without dates filled, showing warning.",
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
        story: "state with period complete, without display of the warning.",
      },
    },
  },
};

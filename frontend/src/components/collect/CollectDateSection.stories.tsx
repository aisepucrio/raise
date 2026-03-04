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
    docs: {
      description: {
        component:
          "Bloco de período do collect com aviso opcional e filtro compartilhado de datas (start/end).",
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

export const ComAviso: Story = {
  render: (args) => <CollectDateSectionDemo {...args} />,
};

export const ComDatasPreenchidas: Story = {
  render: (args) => <CollectDateSectionDemo {...args} />,
  args: {
    startDate: "2026-01-10",
    endDate: "2026-01-31",
  },
};

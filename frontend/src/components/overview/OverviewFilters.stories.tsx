import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { OverviewFilters } from "./OverviewFilters";
import type { OverviewDateRange } from "./OverviewFilters";

type OverviewFiltersDemoProps = {
  initialSourceId?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  dateRange?: OverviewDateRange;
};

const SOURCE_OPTIONS = [
  { value: "acme/api", label: "acme/api" },
  { value: "acme/web", label: "acme/web" },
  { value: "acme/mobile", label: "acme/mobile" },
];

function OverviewFiltersDemo({
  initialSourceId = "",
  initialStartDate = "",
  initialEndDate = "",
  dateRange,
}: OverviewFiltersDemoProps) {
  const [selectedSourceId, setSelectedSourceId] = useState(initialSourceId);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  return (
    <OverviewFilters
      idPrefix="storybook-overview"
      sourceFilterLabel="Repository"
      allSourcesOptionLabel="All repositories"
      sourceOptions={SOURCE_OPTIONS}
      selectedSourceId={selectedSourceId}
      onSourceChange={setSelectedSourceId}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      dateRange={dateRange}
    />
  );
}

const meta = {
  title: "Components/Overview/OverviewFilters",
  component: OverviewFilters,
  tags: ["autodocs"],
  argTypes: {
    idPrefix: {
      control: { type: "text" },
      description: "Prefix used to generate IDs for internal fields.",
      table: { type: { summary: "string" } },
    },
    sourceFilterLabel: {
      control: { type: "text" },
      description: "Label shown in the source filter.",
      table: { type: { summary: "string" } },
    },
    allSourcesOptionLabel: {
      control: { type: "text" },
      description: "Text for the neutral option (all sources).",
      table: { type: { summary: "string" } },
    },
    sourceOptions: {
      control: false,
      description: "List of options available in the source filter.",
      table: { type: { summary: "{ value: string; label: string }[]" } },
    },
    selectedSourceId: {
      control: { type: "text" },
      description: "Source selected in the filter.",
      table: { type: { summary: "string" } },
    },
    onSourceChange: {
      control: false,
      description: "Callback triggered when source changes.",
      table: { type: { summary: "(value: string) => void" } },
    },
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
      control: false,
      description: "Callback triggered to change start date.",
      table: { type: { summary: "(value: string) => void" } },
    },
    onEndDateChange: {
      control: false,
      description: "Callback triggered to change end date.",
      table: { type: { summary: "(value: string) => void" } },
    },
    isSourceListPending: {
      control: { type: "boolean" },
      description: "Indicates loading state of source list.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    dateRange: {
      control: false,
      description: "Optional min/max date bounds.",
      table: { type: { summary: "{ minDate?: string; maxDate?: string }" } },
    },
  },
  args: {
    idPrefix: "storybook-overview",
    sourceFilterLabel: "Repository",
    allSourcesOptionLabel: "All repositories",
    sourceOptions: SOURCE_OPTIONS,
    selectedSourceId: "",
    onSourceChange: () => undefined,
    startDate: "",
    endDate: "",
    onStartDateChange: () => undefined,
    onEndDateChange: () => undefined,
  },
  parameters: {
    wrapperSize: "large",
    docs: {
      description: {
        component:
          "Filters block with source selection and date range.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-5xl rounded-xl border border-(--color-secondary-soft) bg-(--color-primary)">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OverviewFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <OverviewFiltersDemo />,
  parameters: {
    docs: {
      description: {
        story: "Default filter with source selection and empty date range.",
      },
    },
  },
};

export const WithSelectedSource: Story = {
  render: () => (
    <OverviewFiltersDemo
      initialSourceId="acme/api"
      initialStartDate="2026-01-01"
      initialEndDate="2026-02-15"
      dateRange={{ minDate: "2025-01-01", maxDate: "2026-03-01" }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Example with source and initial date range already defined.",
      },
    },
  },
};

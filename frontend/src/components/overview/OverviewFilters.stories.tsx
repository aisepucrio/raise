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
          "Bloco de filtros com seleção de fonte e intervalo de datas.",
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

export const Padrao: Story = {
  render: () => <OverviewFiltersDemo />,
};

export const ComSourceSelecionado: Story = {
  render: () => (
    <OverviewFiltersDemo
      initialSourceId="acme/api"
      initialStartDate="2026-01-01"
      initialEndDate="2026-02-15"
      dateRange={{ minDate: "2025-01-01", maxDate: "2026-03-01" }}
    />
  ),
};

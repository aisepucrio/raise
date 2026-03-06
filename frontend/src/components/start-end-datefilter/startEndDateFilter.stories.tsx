import { useEffect, useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/button";
import { StartEndDateFilter } from "./startEndDateFilter";
import type { StartEndDateRange } from "./startEndDateFilter.utils";

function InteractiveDateRangeDemo() {
  const [source, setSource] = useState<"source-a" | "source-b">("source-a");
  const [startDate, setStartDate] = useState("2026-01-20");
  const [endDate, setEndDate] = useState("2026-02-10");

  const dateRange = useMemo<StartEndDateRange>(
    () =>
      source === "source-a"
        ? {
            minDate: "2026-01-01T00:00:00Z",
            maxDate: "2026-03-31T23:59:59Z",
          }
        : {
            minDate: "2026-02-15T00:00:00Z",
            maxDate: "2026-04-10T23:59:59Z",
          },
    [source],
  );

  // Simulates external source + date-range change.
  useEffect(() => {
    if (source === "source-b") {
      setStartDate("2026-01-20");
      setEndDate("2026-02-20");
    }
  }, [source]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          text="Source A"
          size="sm"
          fullWidth={false}
          variant="selectable"
          selected={source === "source-a"}
          onClick={() => setSource("source-a")}
        />
        <Button
          text="Source B"
          size="sm"
          fullWidth={false}
          variant="selectable"
          selected={source === "source-b"}
          onClick={() => setSource("source-b")}
        />
      </div>

      <StartEndDateFilter
        idPrefix="storybook-start-end-filter-dynamic"
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        dateRange={dateRange}
        width="full"
      />

      <p className="rounded-md border border-(--color-secondary-subtle) px-3 py-2 text-sm text-(--color-secondary-muted)">
        source={source} | min={dateRange.minDate} | max={dateRange.maxDate} |
        start={startDate || "(empty)"} | end={endDate || "(empty)"}
      </p>
    </div>
  );
}

const meta = {
  title: "Components/Form/StartEndDateFilter",
  component: StartEndDateFilter,
  tags: ["autodocs"],
  argTypes: {
    idPrefix: {
      control: { type: "text" },
      description: "Prefix used to generate IDs for date fields.",
      table: { type: { summary: "string" } },
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
      action: "startChanged",
      description: "Callback triggered to change start date.",
      table: { type: { summary: "(value: string) => void" } },
    },
    onEndDateChange: {
      action: "endChanged",
      description: "Callback triggered to change end date.",
      table: { type: { summary: "(value: string) => void" } },
    },
    startLabel: {
      control: { type: "text" },
      description: "Start field label.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Start" } },
    },
    endLabel: {
      control: { type: "text" },
      description: "label of the end field.",
      table: { type: { summary: "string" }, defaultValue: { summary: "End" } },
    },
    error: {
      control: { type: "text" },
      description: "Shared error message for both fields.",
      table: { type: { summary: "string" } },
    },
    width: {
      control: { type: "inline-radio" },
      options: ["full", "compact"],
      description: "Defines width/layout of the field pair.",
      table: { type: { summary: "\"full\" | \"compact\"" }, defaultValue: { summary: "full" } },
    },
    className: {
      control: false,
      description: "Additional CSS class for container.",
      table: { type: { summary: "string" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "Disables both date fields.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    dateRange: {
      control: false,
      description: "Optional min/max date limits.",
      table: { type: { summary: "{ minDate?: string; maxDate?: string }" } },
    },
    startWrapperClassName: {
      control: false,
      description: "Additional CSS class for start-field wrapper.",
      table: { type: { summary: "string" } },
    },
    endWrapperClassName: {
      control: false,
      description: "Additional CSS class for end-field wrapper.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    idPrefix: "storybook-start-end-filter",
    startDate: "2026-01-05",
    endDate: "2026-02-10",
    startLabel: "Start",
    endLabel: "End",
  },
  parameters: {
    wrapperSize: "medium",
    docs: {
      description: {
        component:
          "Date range filter with start/end validation and minimum/maximum limits support.",
      },
    },
  },
} satisfies Meta<typeof StartEndDateFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullWidth: Story = {
  args: {
    width: "full",
  },
  parameters: {
    docs: {
      description: {
        story: "Layout with fields occupying full available width.",
      },
    },
  },
};

export const CompactWidth: Story = {
  args: {
    width: "compact",
  },
  parameters: {
    docs: {
      description: {
        story: "Compact layout with fixed width for each field.",
      },
    },
  },
};

export const WithDynamicDateRange: Story = {
  render: () => <InteractiveDateRangeDemo />,
  parameters: {
    docs: {
      description: {
        story: "Demonstrates dynamic date-limit updates according to selected source.",
      },
    },
  },
};

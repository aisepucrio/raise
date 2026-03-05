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
      description: "Data inicial no formato `YYYY-MM-DD`.",
      table: { type: { summary: "string" } },
    },
    endDate: {
      control: { type: "text" },
      description: "Data final no formato `YYYY-MM-DD`.",
      table: { type: { summary: "string" } },
    },
    onStartDateChange: {
      action: "startDateChange",
      description: "Callback disparado ao alterar data inicial.",
      table: { type: { summary: "(value: string) => void" } },
    },
    onEndDateChange: {
      action: "endDateChange",
      description: "Callback disparado ao alterar data final.",
      table: { type: { summary: "(value: string) => void" } },
    },
    dateFilterIdPrefix: {
      control: { type: "text" },
      description: "Prefixo usado para gerar IDs internos do filtro.",
      table: { type: { summary: "string" } },
    },
    dateWarningMessage: {
      control: { type: "text" },
      description: "Mensagem exibida quando período está vazio.",
      table: { type: { summary: "string" } },
    },
    startLabel: {
      control: { type: "text" },
      description: "Rótulo do campo de data inicial.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Start" } },
    },
    endLabel: {
      control: { type: "text" },
      description: "Rótulo do campo de data final.",
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
          "Seção de período com seleção de data inicial/final e aviso opcional.",
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
  parameters: {
    docs: {
      description: {
        story: "Estado inicial sem datas preenchidas, exibindo aviso.",
      },
    },
  },
};

export const ComDatasPreenchidas: Story = {
  render: (args) => <CollectDateSectionDemo {...args} />,
  args: {
    startDate: "2026-01-10",
    endDate: "2026-01-31",
  },
  parameters: {
    docs: {
      description: {
        story: "Estado com período completo, sem exibição do aviso.",
      },
    },
  },
};

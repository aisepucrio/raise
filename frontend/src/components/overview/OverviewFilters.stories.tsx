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
      description: "Prefixo usado para gerar IDs dos campos internos.",
      table: { type: { summary: "string" } },
    },
    sourceFilterLabel: {
      control: { type: "text" },
      description: "Label exibido no filtro de fonte.",
      table: { type: { summary: "string" } },
    },
    allSourcesOptionLabel: {
      control: { type: "text" },
      description: "Texto da opção neutra (todas as fontes).",
      table: { type: { summary: "string" } },
    },
    sourceOptions: {
      control: false,
      description: "Lista de opções disponíveis no filtro de fonte.",
      table: { type: { summary: "{ value: string; label: string }[]" } },
    },
    selectedSourceId: {
      control: { type: "text" },
      description: "Fonte selecionada no filtro.",
      table: { type: { summary: "string" } },
    },
    onSourceChange: {
      control: false,
      description: "Callback disparado quando a fonte é alterada.",
      table: { type: { summary: "(value: string) => void" } },
    },
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
      control: false,
      description: "Callback disparado ao alterar data inicial.",
      table: { type: { summary: "(value: string) => void" } },
    },
    onEndDateChange: {
      control: false,
      description: "Callback disparado ao alterar data final.",
      table: { type: { summary: "(value: string) => void" } },
    },
    isSourceListPending: {
      control: { type: "boolean" },
      description: "Indica carregamento da lista de fontes.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    dateRange: {
      control: false,
      description: "Limites opcionais de data mínima e máxima.",
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
  parameters: {
    docs: {
      description: {
        story: "Filtro padrão com seleção de fonte e período em branco.",
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story: "Exemplo com fonte e intervalo inicial já definidos.",
      },
    },
  },
};

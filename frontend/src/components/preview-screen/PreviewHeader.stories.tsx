import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PreviewHeader } from "./PreviewHeader";

function InteractiveDemo({
  showSourceFilter = true,
  showDateFilters = true,
}: {
  showSourceFilter?: boolean;
  showDateFilters?: boolean;
}) {
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [startDate, setStartDate] = useState("2026-01-05");
  const [endDate, setEndDate] = useState("2026-02-10");
  const [searchTerm, setSearchTerm] = useState("");
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(["notes"]);
  const [exportCount, setExportCount] = useState(0);

  return (
    <div className="space-y-3">
      <PreviewHeader
        idPrefix="storybook-preview-header"
        sourceFilterLabel="Repository"
        selectedSourceId={selectedSourceId}
        onSelectedSourceIdChange={setSelectedSourceId}
        sourceOptions={[
          { value: "1", label: "acme/api" },
          { value: "2", label: "acme/web" },
        ]}
        allSourcesOptionLabel="All repositories"
        isSourceListPending={false}
        showSourceFilter={showSourceFilter}
        showDateFilters={showDateFilters}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        minDate="2026-01-01"
        maxDate="2026-03-31"
        onSearchChange={setSearchTerm}
        columns={["id", "title", "author", "status", "notes"]}
        hiddenColumns={hiddenColumns}
        onHiddenColumnsChange={(nextHiddenColumns) => {
          setHiddenColumns((currentHiddenColumns) =>
            typeof nextHiddenColumns === "function"
              ? nextHiddenColumns(currentHiddenColumns)
              : nextHiddenColumns,
          );
        }}
        onExport={() => setExportCount((currentValue) => currentValue + 1)}
        isExportPending={false}
      />

      <div className="rounded-md border border-(--color-secondary-subtle) px-3 py-2 text-sm text-(--color-secondary-muted)">
        source={selectedSourceId || "(all)"} | start={startDate || "(empty)"} | end=
        {endDate || "(empty)"} | search={searchTerm || "(empty)"} | exports=
        {exportCount}
      </div>
    </div>
  );
}

const meta = {
  title: "Components/Preview/PreviewHeader",
  component: PreviewHeader,
  tags: ["autodocs"],
  argTypes: {
    onSelectedSourceIdChange: { control: false },
    onStartDateChange: { control: false },
    onEndDateChange: { control: false },
    onSearchChange: { control: false },
    onHiddenColumnsChange: { control: false },
    onExport: { control: false },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Bloco de filtros e ações do preview (fonte principal, intervalo de datas opcional, busca, colunas e export). Foi extraído para reduzir duplicação entre fontes como GitHub e Jira.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="px-4 py-6">
        <div className="w-full rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-6 text-(--color-secondary)">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof PreviewHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => <InteractiveDemo />,
};

export const SemFiltroData: Story = {
  render: () => <InteractiveDemo showDateFilters={false} />,
};

export const SemFiltroFonte: Story = {
  render: () => <InteractiveDemo showSourceFilter={false} />,
};

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SourceSelectFilter } from "@/components/source-select-filter";
import { StartEndDateFilter } from "@/components/start-end-datefilter";
import { PreviewHeader } from "./PreviewHeader";

function InteractiveDemo({
  withOptionalFilters = true,
}: {
  withOptionalFilters?: boolean;
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
        onSearchChange={setSearchTerm}
        columns={[
          "id",
          "title",
          "author",
          "status",
          "notes",
          "created_at",
        ]}
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
      >
        {withOptionalFilters ? (
          <>
            <SourceSelectFilter
              id="storybook-preview-header-source"
              label="Repository"
              value={selectedSourceId}
              onChange={setSelectedSourceId}
              options={[
                { value: "1", label: "acme/api" },
                { value: "2", label: "acme/web" },
              ]}
              allOptionLabel="All repositories"
              wrapperClassName="min-w-0 flex-1 xl:min-w-44"
              className="font-semibold"
            />

            <div className="shrink-0">
              <StartEndDateFilter
                idPrefix="storybook-preview-header-date"
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                width="compact"
                dateRange={{ minDate: "2026-01-01", maxDate: "2026-03-31" }}
              />
            </div>
          </>
        ) : null}
      </PreviewHeader>

      <div className="rounded-md border border-(--color-secondary-subtle) px-3 py-2 text-sm text-(--color-secondary-muted)">
        source={selectedSourceId || "(all)"} | start={startDate || "(empty)"} |
        end={endDate || "(empty)"} | search={searchTerm || "(empty)"} |
        exports={exportCount}
      </div>
    </div>
  );
}

const meta = {
  title: "Components/Preview/PreviewHeader",
  component: PreviewHeader,
  tags: ["autodocs"],
  argTypes: {
    idPrefix: {
      control: { type: "text" },
      description: "Prefixo usado para gerar IDs internos dos campos.",
      table: { type: { summary: "string" } },
    },
    onSearchChange: {
      control: false,
      description: "Callback disparado quando o texto da busca muda.",
      table: { type: { summary: "(searchTerm: string) => void" } },
    },
    columns: {
      control: false,
      description: "Lista total de colunas disponíveis no filtro de visibilidade.",
      table: { type: { summary: "string[]" } },
    },
    hiddenColumns: {
      control: false,
      description: "Lista de colunas atualmente ocultas.",
      table: { type: { summary: "string[]" } },
    },
    onHiddenColumnsChange: {
      control: false,
      description:
        "Callback controlado para atualizar as colunas ocultas (valor direto ou updater).",
      table: {
        type: {
          summary:
            "(nextHiddenColumns: string[] | ((currentHiddenColumns: string[]) => string[])) => void",
        },
      },
    },
    onExport: {
      control: false,
      description: "Callback disparado no clique do botão Export.",
      table: { type: { summary: "() => void" } },
    },
    isExportPending: {
      control: { type: "boolean" },
      description: "Controla estado pendente/desabilitado da exportação.",
      table: { type: { summary: "boolean" } },
    },
    children: {
      control: false,
      description: "Área opcional para filtros extras (source, datas etc.).",
      table: { type: { summary: "ReactNode" } },
    },
  },
  parameters: {
    wrapperSize: "large",
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Cabeçalho de preview com busca, controle de colunas e exportação, além de filtros opcionais.",
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

export const ComFiltros: Story = {
  render: () => <InteractiveDemo withOptionalFilters />,
  parameters: {
    docs: {
      description: {
        story: "Cabeçalho completo com filtros adicionais, busca, colunas e exportação.",
      },
    },
  },
};

export const SomenteAcoesFixas: Story = {
  render: () => <InteractiveDemo withOptionalFilters={false} />,
  parameters: {
    docs: {
      description: {
        story: "Versão mínima com apenas ações fixas: busca, colunas e exportação.",
      },
    },
  },
};

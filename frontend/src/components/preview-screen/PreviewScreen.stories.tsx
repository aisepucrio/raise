import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/button";
import { ThemeProvider } from "@/lib/theme-context";
import type { PreviewRow } from "@/sources/shared/PreviewShared";
import { Toast } from "@/components/toast";
import { PreviewScreen, type PreviewScreenBuildParamsInput } from "./PreviewScreen";

type DemoPreviewParams = {
  page: number;
  page_size: number;
  search?: string;
  ordering?: string;
  source?: string;
  created__gte?: string;
  created__lte?: string;
};

type DemoPreviewRow = PreviewRow & {
  source: string;
  created: string;
};

const DEMO_ROWS: DemoPreviewRow[] = [
  { id: 1, source: "1", created: "2026-01-04", title: "Issue A", author: "ana" },
  { id: 2, source: "1", created: "2026-01-17", title: "Issue B", author: "bruno" },
  { id: 3, source: "1", created: "2026-02-05", title: "Issue C", author: "carla" },
  { id: 4, source: "2", created: "2026-02-09", title: "Issue D", author: "diego" },
  { id: 5, source: "2", created: "2026-02-20", title: "Issue E", author: "erika" },
  { id: 6, source: "2", created: "2026-03-03", title: "Issue F", author: "felipe" },
  { id: 7, source: "1", created: "2026-03-12", title: "Issue G", author: "gabi" },
];

const DEMO_SOURCE_OPTIONS = [
  { value: "1", label: "acme/api" },
  { value: "2", label: "acme/web" },
];

function buildDemoPreviewParams(
  input: PreviewScreenBuildParamsInput,
): DemoPreviewParams {
  return {
    page: input.page,
    page_size: input.rowsPerPage,
    ...(input.selectedSourceId ? { source: input.selectedSourceId } : {}),
    ...(input.search ? { search: input.search } : {}),
    ...(input.ordering ? { ordering: input.ordering } : {}),
    ...(input.dateFilters?.startDate
      ? { created__gte: input.dateFilters.startDate }
      : {}),
    ...(input.dateFilters?.endDate ? { created__lte: input.dateFilters.endDate } : {}),
  };
}

function resolveRows(params: DemoPreviewParams) {
  let rows = [...DEMO_ROWS];

  if (params.source) {
    rows = rows.filter((row) => row.source === params.source);
  }

  if (params.search) {
    const normalizedSearch = params.search.toLowerCase();
    rows = rows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(normalizedSearch),
    );
  }

  if (params.created__gte) {
    rows = rows.filter((row) => row.created >= params.created__gte!);
  }

  if (params.created__lte) {
    rows = rows.filter((row) => row.created <= params.created__lte!);
  }

  if (params.ordering) {
    const isDesc = params.ordering.startsWith("-");
    const field = isDesc ? params.ordering.slice(1) : params.ordering;

    rows.sort((left, right) => {
      const leftValue = String(left[field as keyof DemoPreviewRow] ?? "");
      const rightValue = String(right[field as keyof DemoPreviewRow] ?? "");
      return isDesc
        ? rightValue.localeCompare(leftValue)
        : leftValue.localeCompare(rightValue);
    });
  }

  const total = rows.length;
  const start = (params.page - 1) * params.page_size;
  const pagedRows = rows.slice(start, start + params.page_size);

  return { total, pagedRows };
}

type DemoQueryMode = "success" | "loading" | "error" | "empty";
type DemoExportMode = "success" | "error" | "pending";

function PreviewScreenInteractiveDemo() {
  const [queryMode, setQueryMode] = useState<DemoQueryMode>("success");
  const [exportMode, setExportMode] = useState<DemoExportMode>("success");

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-(--color-secondary-soft) p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Query:</span>
          <Button
            text="Success"
            size="sm"
            fullWidth={false}
            variant="selectable"
            selected={queryMode === "success"}
            onClick={() => setQueryMode("success")}
          />
          <Button
            text="Loading"
            size="sm"
            fullWidth={false}
            variant="selectable"
            selected={queryMode === "loading"}
            onClick={() => setQueryMode("loading")}
          />
          <Button
            text="Empty"
            size="sm"
            fullWidth={false}
            variant="selectable"
            selected={queryMode === "empty"}
            onClick={() => setQueryMode("empty")}
          />
          <Button
            text="Error"
            size="sm"
            fullWidth={false}
            variant="selectable"
            selected={queryMode === "error"}
            onClick={() => setQueryMode("error")}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Export:</span>
          <Button
            text="Success"
            size="sm"
            fullWidth={false}
            variant="selectable"
            selected={exportMode === "success"}
            onClick={() => setExportMode("success")}
          />
          <Button
            text="Error"
            size="sm"
            fullWidth={false}
            variant="selectable"
            selected={exportMode === "error"}
            onClick={() => setExportMode("error")}
          />
          <Button
            text="Pending"
            size="sm"
            fullWidth={false}
            variant="selectable"
            selected={exportMode === "pending"}
            onClick={() => setExportMode("pending")}
          />
        </div>
      </section>

      <div className="h-[42rem]">
        <PreviewScreen<DemoPreviewParams>
          idPrefix="storybook-preview-screen-interactive"
          previewSection="demo"
          sourceFilterLabel="Repository"
          allSourcesOptionLabel="All repositories"
          sourceOptions={DEMO_SOURCE_OPTIONS}
          isSourceListPending={false}
          itemsLabel="issues"
          emptyStateMessage="No issues found for the selected filters."
          loadErrorMessage="Failed to load demo preview."
          exportFileNamePrefix="demo-preview-interactive"
          exportSuccessMessage="Demo preview exported successfully."
          showDateFilters
          useDateRangeBySourceQuery={(sourceId) =>
            sourceId === "2"
              ? { data: { minDate: "2026-02-01", maxDate: "2026-03-31" } }
              : { data: { minDate: "2026-01-01", maxDate: "2026-03-31" } }
          }
          usePreviewBySourceQuery={(_, params) => {
            if (queryMode === "loading") {
              return {
                data: undefined,
                isPending: true,
                isError: false,
                error: null,
              };
            }

            if (queryMode === "error") {
              return {
                data: undefined,
                isPending: false,
                isError: true,
                error: new Error("Simulated preview query error."),
              };
            }

            if (queryMode === "empty") {
              return {
                data: { count: 0, results: [] },
                isPending: false,
                isError: false,
                error: null,
              };
            }

            const { total, pagedRows } = resolveRows(params);
            return {
              data: { count: total, results: pagedRows },
              isPending: false,
              isError: false,
              error: null,
            };
          }}
          buildPreviewParams={buildDemoPreviewParams}
          requestExportPayload={async () => {
            if (exportMode === "error") {
              throw new Error("Simulated export error.");
            }

            return new Blob([JSON.stringify({ ok: true }, null, 2)], {
              type: "application/json",
            });
          }}
          isExportPending={exportMode === "pending"}
        />
      </div>
    </div>
  );
}

const meta = {
  title: "Components/Preview/PreviewScreen",
  component: PreviewScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Container compartilhado com a lógica de preview (filtros, paginação, ordenação, colunas dinâmicas, export e modal). As fontes (GitHub/Jira) ficam apenas com mapeamento de hooks e payload.",
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div className="px-4 py-6">
          <div className="w-full rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-6 text-(--color-secondary)">
            <Story />
          </div>
        </div>
        <Toast closeButton richColors position="top-center" />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof PreviewScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PadraoComData: Story = {
  render: () => (
    <div className="h-[42rem]">
      <PreviewScreen<DemoPreviewParams>
        idPrefix="storybook-preview-screen"
        previewSection="demo"
        sourceFilterLabel="Repository"
        allSourcesOptionLabel="All repositories"
        sourceOptions={DEMO_SOURCE_OPTIONS}
        isSourceListPending={false}
        itemsLabel="issues"
        emptyStateMessage="No issues found for the selected filters."
        loadErrorMessage="Failed to load demo preview."
        exportFileNamePrefix="demo-preview"
        exportSuccessMessage="Demo preview exported successfully."
        showDateFilters
        useDateRangeBySourceQuery={(sourceId) =>
          sourceId === "2"
            ? { data: { minDate: "2026-02-01", maxDate: "2026-03-31" } }
            : { data: { minDate: "2026-01-01", maxDate: "2026-03-31" } }
        }
        usePreviewBySourceQuery={(_, params) => {
          const { total, pagedRows } = resolveRows(params);
          return {
            data: { count: total, results: pagedRows },
            isPending: false,
            isError: false,
            error: null,
          };
        }}
        buildPreviewParams={buildDemoPreviewParams}
        requestExportPayload={async () =>
          new Blob([JSON.stringify({ ok: true }, null, 2)], {
            type: "application/json",
          })
        }
        isExportPending={false}
      />
    </div>
  ),
};

export const SemFiltroData: Story = {
  render: () => (
    <div className="h-[42rem]">
      <PreviewScreen<DemoPreviewParams>
        idPrefix="storybook-preview-screen-users"
        previewSection="demo-users"
        sourceFilterLabel="Repository"
        allSourcesOptionLabel="All repositories"
        sourceOptions={DEMO_SOURCE_OPTIONS}
        isSourceListPending={false}
        itemsLabel="users"
        emptyStateMessage="No users found for the selected filters."
        loadErrorMessage="Failed to load demo users preview."
        exportFileNamePrefix="demo-users-preview"
        showDateFilters={false}
        useDateRangeBySourceQuery={() => ({ data: undefined })}
        usePreviewBySourceQuery={(_, params) => {
          const { total, pagedRows } = resolveRows(params);
          return {
            data: { count: total, results: pagedRows },
            isPending: false,
            isError: false,
            error: null,
          };
        }}
        buildPreviewParams={buildDemoPreviewParams}
        requestExportPayload={async () =>
          new Blob([JSON.stringify({ ok: true }, null, 2)], {
            type: "application/json",
          })
        }
        isExportPending={false}
      />
    </div>
  ),
};

export const CenariosInterativos: Story = {
  render: () => <PreviewScreenInteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Use os botões para simular estados de query (`loading`, `error`, `empty`) e export (`success`, `error`, `pending`) durante o preview.",
      },
    },
  },
};

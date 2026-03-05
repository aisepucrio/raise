import type { ReactNode } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/button";
import { ColumnVisibilityFilter } from "@/components/column-visibility-filter";
import { SearchBar } from "@/components/search-bar";

export type PreviewHeaderProps = {
  idPrefix: string;
  onSearchChange: (searchTerm: string) => void;
  columns: string[];
  hiddenColumns: string[];
  onHiddenColumnsChange: (
    nextHiddenColumns:
      | string[]
      | ((currentHiddenColumns: string[]) => string[]),
  ) => void;
  onExport: () => void;
  isExportPending: boolean;
  children?: ReactNode;
};

export function PreviewHeader({
  idPrefix,
  onSearchChange,
  columns,
  hiddenColumns,
  onHiddenColumnsChange,
  onExport,
  isExportPending,
  children,
}: PreviewHeaderProps) {
  return (
    <section className="shrink-0 px-1">
      <div className="grid gap-3 overflow-visible pb-1 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        {/* area livre for filters optional of the item (source/date etc.) */}
        {children ? (
          <div className="flex min-w-0 flex-wrap items-end gap-3 md:col-span-3 xl:col-span-1 xl:flex-nowrap">
            {children}
          </div>
        ) : null}

        {/* actions always presentes in the preview (segunda row in the layout intermediate) */}
        <div className="min-w-0 self-end md:col-start-1 xl:col-start-auto">
          <SearchBar
            id={`${idPrefix}-search`}
            onSearchChange={onSearchChange}
            expandable
          />
        </div>

        <ColumnVisibilityFilter
          className="self-end"
          buttonClassName="h-11 min-h-11 w-full px-3.5 py-0 md:w-auto"
          columns={columns}
          hiddenColumns={hiddenColumns}
          onHiddenColumnsChange={onHiddenColumnsChange}
        />

        <div className="self-end">
          <Button
            text={isExportPending ? "Exporting..." : "Export"}
            icon={<Download />}
            fullWidth={false}
            className="h-11 min-h-11 w-full px-3.5 py-0 md:w-auto"
            onClick={() => onExport()}
            disabled={isExportPending}
          />
        </div>
      </div>
    </section>
  );
}

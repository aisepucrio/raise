import { useMemo, useState } from "react";

import {
  PreviewTable,
  PreviewWrapper,
  PreviewHeader,
} from "@/components/preview";
import { SearchBar } from "@/components/search-bar";

import { useRedditPreviewQuery } from "@/data";

export type RedditSection = "posts" | "comments" | "users";

type Props = {
  idPrefix: string;
  previewSection: RedditSection;
  itemsLabel: string;
  emptyStateMessage: string;
  loadErrorMessage: string;
  exportTable: string;
  exportFileNamePrefix: string;
};

export function RedditPreview({
  idPrefix,
  previewSection,
  itemsLabel,
}: Props) {
  const [search, setSearch] = useState("");
  const [subreddit, setSubreddit] = useState("");

  const previewQuery = useRedditPreviewQuery();

  const rows = previewQuery.data?.results ?? [];

  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]);
  }, [rows]);

  return (
    <PreviewWrapper>
      <PreviewHeader
        idPrefix={idPrefix}
        onSearchChange={setSearch}
        columns={columns}
        hiddenColumns={[]}
        onHiddenColumnsChange={() => {}}
        onExport={() => {}}
        isExportPending={false}
      >
        <SearchBar
          id={`${idPrefix}-subreddit-filter`}
          onSearchChange={setSubreddit}
          placeholder="Filter by subreddit..."
        />
      </PreviewHeader>

      <PreviewTable
        rows={rows}
        visibleColumns={columns}
        tableColumns={columns}
        sortState={null}
        onSort={() => {}}
        onOpenCellPreview={() => {}}
        isTablePending={previewQuery.isPending}
        emptyStateMessage={`No ${itemsLabel} found`}
        currentPage={1}
        rowsPerPage={10}
        totalItems={rows.length}
        itemsLabel={itemsLabel}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
      />
    </PreviewWrapper>
  );
}
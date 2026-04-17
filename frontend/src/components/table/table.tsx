import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

type TableProps = React.ComponentProps<"table"> & {
  withContainer?: boolean;
  containerClassName?: string;
};

export function Table({
  className,
  withContainer = true,
  containerClassName,
  ...props
}: TableProps) {
  const tableElement = (
    <table
      data-slot="table"
      className={cn(
        "w-full caption-bottom text-sm text-(--color-secondary)",
        className,
      )}
      {...props}
    />
  );

  if (!withContainer) return tableElement;

  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", containerClassName)}
    >
      {tableElement}
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:border-b [&_tr]:border-(--color-secondary-subtle)",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

export function TableFooter({
  className,
  ...props
}: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-(--color-secondary-subtle) bg-(--color-secondary-subtle) font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-(--color-secondary-subtle) transition-colors hover:bg-(--color-secondary-subtle) data-[state=selected]:bg-(--color-secondary-subtle)",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle text-[0.90rem] font-bold whitespace-nowrap text-(--color-secondary-strong) [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

export type TableSortDirection = "asc" | "desc" | null;

type TableSortableHeadProps = React.ComponentProps<"th"> & {
  sortDirection?: TableSortDirection;
  onSort?: (() => void) | null;
  showSortIcon?: boolean;
  buttonClassName?: string;
  iconClassName?: string;
};

export function TableSortableHead({
  className,
  sortDirection = null,
  onSort,
  showSortIcon = true,
  buttonClassName,
  iconClassName,
  children,
  title,
  ...props
}: TableSortableHeadProps) {
  const isSortable = typeof onSort === "function";

  if (!isSortable) {
    return (
      <TableHead className={className} title={title} {...props}>
        {children}
      </TableHead>
    );
  }

  const SortIcon =
    sortDirection === "asc"
      ? ArrowUp
      : sortDirection === "desc"
        ? ArrowDown
        : ArrowUpDown;

  return (
    <TableHead
      className={className}
      aria-sort={
        sortDirection === "asc"
          ? "ascending"
          : sortDirection === "desc"
            ? "descending"
            : undefined
      }
      {...props}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 text-left font-bold",
          buttonClassName,
        )}
        onClick={onSort}
        title={title}
      >
        <span>{children}</span>
        {showSortIcon ? (
          <SortIcon
            className={cn(
              "size-3.5",
              sortDirection === null && "opacity-65",
              iconClassName,
            )}
          />
        ) : null}
      </button>
    </TableHead>
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-(--color-secondary-muted)", className)}
      {...props}
    />
  );
}

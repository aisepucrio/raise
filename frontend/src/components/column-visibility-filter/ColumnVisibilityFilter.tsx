import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/button";
import { cn } from "@/lib/utils";

export type ColumnVisibilityFilterProps = {
  // Complete list of columns available in the table.
  columns: string[];
  // Controlled list of hidden columns.
  hiddenColumns: string[];
  // Controlled callback to update hidden columns.
  onHiddenColumnsChange: (
    nextHiddenColumns:
      | string[]
      | ((currentHiddenColumns: string[]) => string[]),
  ) => void;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  title?: string;
  description?: string;
};

export function ColumnVisibilityFilter({
  columns,
  hiddenColumns,
  onHiddenColumnsChange,
  className,
  buttonClassName,
  menuClassName,
  title = "Visible columns",
  description = "Select which columns should appear in the table.",
}: ColumnVisibilityFilterProps) {
  // Local state only for popover visibility.
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Derived list used for quick visual summary in the button.
  const visibleColumnsCount = useMemo(
    () => columns.filter((column) => !hiddenColumns.includes(column)).length,
    [columns, hiddenColumns],
  );

  // keeps the selection consistent when the set of columns changes.
  useEffect(() => {
    onHiddenColumnsChange((currentHiddenColumns) => {
      const filteredHiddenColumns = currentHiddenColumns.filter((column) =>
        columns.includes(column),
      );

      if (filteredHiddenColumns.length === currentHiddenColumns.length) {
        return currentHiddenColumns;
      }

      return filteredHiddenColumns;
    });
  }, [columns, onHiddenColumnsChange]);

  // Closes popover on outside click or ESC key.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!containerRef.current) return;
      if (containerRef.current.contains(target)) return;
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function setColumnVisible(column: string, isVisible: boolean) {
    onHiddenColumnsChange((currentHiddenColumns) => {
      if (isVisible) {
        return currentHiddenColumns.filter(
          (currentColumn) => currentColumn !== column,
        );
      }

      if (currentHiddenColumns.includes(column)) {
        return currentHiddenColumns;
      }

      return [...currentHiddenColumns, column];
    });
  }

  function handleShowAll() {
    onHiddenColumnsChange([]);
  }

  function handleHideAll() {
    onHiddenColumnsChange([...columns]);
  }

  const isDisabled = columns.length === 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Main button with X/Y summary of visible columns. */}
      <Button
        text={`Columns (${visibleColumnsCount}/${columns.length})`}
        icon={<SlidersHorizontal />}
        fullWidth={false}
        variant="selectable"
        selected={isOpen}
        className={cn("min-h-11 w-full px-3.5", buttonClassName)}
        onClick={() => setIsOpen((current) => !current)}
        disabled={isDisabled}
      />

      {isOpen ? (
        <div
          className={cn(
            "absolute right-0 z-20 mt-2 w-80 max-w-[90vw] rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-3 shadow-lg",
            menuClassName,
          )}
        >
          {/* Text header in popover to guide the user. */}
          <p className="text-sm font-semibold text-(--color-secondary)">
            {title}
          </p>
          <p className="text-xs text-(--color-secondary-muted)">
            {description}
          </p>

          <div className="mt-3 max-h-56 space-y-1 overflow-auto pr-1">
            {/* Checkbox list to control per-column visibility. */}
            {columns.map((column) => {
              const isVisible = !hiddenColumns.includes(column);

              return (
                <label
                  key={`column-filter-${column}`}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-(--color-secondary-subtle)"
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(event) =>
                      setColumnVisible(column, event.target.checked)
                    }
                    className="size-4 accent-[var(--color-secondary)]"
                  />
                  <span className="truncate text-sm text-(--color-secondary)">
                    {column}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            {/* Shortcuts to toggle visibility globally. */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-(--color-secondary-soft) px-2 py-1 text-xs text-(--color-secondary) hover:bg-(--color-secondary-subtle)"
                onClick={handleShowAll}
                disabled={hiddenColumns.length === 0}
              >
                Show all
              </button>

              <button
                type="button"
                className="rounded-md border border-(--color-secondary-soft) px-2 py-1 text-xs text-(--color-secondary) hover:bg-(--color-secondary-subtle)"
                onClick={handleHideAll}
                disabled={visibleColumnsCount === 0}
              >
                Hide all
              </button>
            </div>

            <button
              type="button"
              className="rounded-md border border-(--color-secondary-soft) px-2 py-1 text-xs text-(--color-secondary) hover:bg-(--color-secondary-subtle)"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

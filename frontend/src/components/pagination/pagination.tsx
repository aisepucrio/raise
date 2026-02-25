import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { Button } from "@/components/button";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationButtonActionProps = {
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  title?: string;
};

type PaginationLinkProps = {
  isActive?: boolean;
  text: string;
  "aria-label"?: string;
} & PaginationButtonActionProps;

function PaginationLink({
  isActive,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      aria-current={isActive ? "page" : undefined}
      fullWidth={false}
      small
      variant="selectable"
      selected={Boolean(isActive)}
      {...props}
    />
  );
}

function PaginationPrevious({
  ...props
}: PaginationButtonActionProps) {
  return (
    <Button
      aria-label="Go to previous page"
      fullWidth={false}
      small
      text="Previous"
      icon={<ChevronLeftIcon />}
      iconSide="left"
      {...props}
    />
  );
}

function PaginationNext({
  ...props
}: PaginationButtonActionProps) {
  return (
    <Button
      aria-label="Go to next page"
      fullWidth={false}
      small
      text="Next"
      icon={<ChevronRightIcon />}
      iconSide="right"
      {...props}
    />
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-9 items-center justify-center text-(--color-pagination-ellipsis)",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};

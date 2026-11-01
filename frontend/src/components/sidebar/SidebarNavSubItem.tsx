export type SidebarNavSubItemProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  // Heading of the group the item belongs to; SidebarNavItem shows it
  // before the group's first item.
  group?: string;
  // A secondary control among the items, such as a "More" toggle.
  muted?: boolean;
};

/**
 * Sidebar navigation subitem.
 * Keeps compact styling and visual highlight when representing the current route.
 */
export default function SidebarNavSubItem({
  label,
  active,
  onClick,
  muted = false,
}: Omit<SidebarNavSubItemProps, "group">) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "w-[78%] self-start rounded-none border-0 border-r-2 border-r-transparent px-6 py-1.5 text-left",
        "text-[0.95rem] font-medium transition-colors duration-150",
        "focus-visible:outline-none",
        active
          ? "border-r-(--color-secondary-mid) bg-(--color-secondary-strong) text-(--color-secondary-inverse)"
          : "bg-transparent opacity-85 hover:bg-(--color-secondary-soft)",
        muted ? "text-[0.85rem] text-(--color-secondary-muted) italic" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

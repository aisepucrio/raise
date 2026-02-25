import type { LucideIcon } from "lucide-react";

type SidebarNavItemProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
};

export default function SidebarNavItem({
  label,
  active,
  onClick,
  icon: Icon,
}: SidebarNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "-ml-6 flex w-[calc(85%+1.5rem)] self-start items-center gap-3 rounded-none rounded-r-md border-0 border-r-2 border-r-transparent px-6 py-2 text-left",
        "text-[1.05rem] font-semibold transition-colors duration-150",
        "focus-visible:outline-none",
        active
          ? "border-r-(--color-sidebar-border) bg-(--color-sidebar-item-active-bg) text-(--color-sidebar-item-active-fg)"
          : "bg-transparent opacity-85 hover:bg-(--color-sidebar-item-hover-bg)",
      ].join(" ")}
    >
      <Icon className="shrink-0" size={18} strokeWidth={2.1} />
      <span>{label}</span>
    </button>
  );
}

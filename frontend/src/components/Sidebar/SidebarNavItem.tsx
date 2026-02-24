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
        "sidebar-nav-item",
        "-ml-6 flex w-[calc(80%+1.5rem)] self-start items-center gap-3 rounded-none rounded-r-xl bg-transparent px-6 py-3 text-left",
        "text-[1.05rem] font-semibold transition-colors duration-150",
        active
          ? "sidebar-nav-item-active opacity-100"
          : "opacity-85 hover:opacity-100",
      ].join(" ")}
    >
      <Icon className="shrink-0" size={18} strokeWidth={2.1} />
      <span>{label}</span>
    </button>
  );
}

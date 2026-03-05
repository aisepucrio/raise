import { useEffect, useState } from "react";
import { ChevronUp, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import SidebarNavSubItem, {
  type SidebarNavSubItemProps,
} from "./SidebarNavSubItem";

export type SidebarNavSubItem = SidebarNavSubItemProps;

type SidebarNavItemProps = {
  label: string;
  active: boolean;
  onClick?: () => void;
  icon: LucideIcon;
  subItems?: SidebarNavSubItem[];
  defaultExpanded?: boolean;
};

/**
 * item main of navigation of the sidebar.
 * Pode funcionar how action simple ou how agrupador expandable of subitems.
 */
export default function SidebarNavItem({
  label,
  active,
  onClick,
  icon: Icon,
  subItems = [],
  defaultExpanded,
}: SidebarNavItemProps) {
  const hasSubItems = subItems.length > 0;
  const hasActiveSubItem = subItems.some((item) => item.active);
  const [expanded, setExpanded] = useState(
    defaultExpanded ?? hasActiveSubItem,
  );
  const isMainItemActive = active || hasActiveSubItem;

  useEffect(() => {
    if (hasSubItems && hasActiveSubItem) {
      setExpanded(true);
    }
  }, [hasSubItems, hasActiveSubItem]);

  const handleMainItemClick = () => {
    if (hasSubItems) {
      setExpanded((value) => !value);
      return;
    }

    onClick?.();
  };

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleMainItemClick}
        aria-current={isMainItemActive ? "page" : undefined}
        aria-expanded={hasSubItems ? expanded : undefined}
        className={[
          "-ml-6 flex w-[calc(85%+1.5rem)] self-start items-center justify-between rounded-none rounded-r-md border-0 border-r-2 border-r-transparent px-6 py-2 text-left",
          "text-[1.05rem] font-semibold transition-colors duration-150",
          "focus-visible:outline-none",
          isMainItemActive
            ? "border-r-(--color-secondary-soft) bg-(--color-secondary) text-(--color-secondary-inverse)"
            : "bg-transparent opacity-85 hover:bg-(--color-secondary-subtle)",
        ].join(" ")}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <Icon className="shrink-0" size={18} strokeWidth={2.1} />
          <span className="truncate">{label}</span>
        </span>
        {hasSubItems ? (
          <motion.span
            className="shrink-0"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <ChevronUp size={16} strokeWidth={2.1} />
          </motion.span>
        ) : null}
      </button>

      <AnimatePresence initial={false}>
        {hasSubItems && expanded ? (
          <motion.div
            key="sidebar-sub-items"
            className="-ml-6 w-[calc(100%+1.5rem)] overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="flex flex-col">
              {subItems.map((subItem, index) => (
                <SidebarNavSubItem
                  key={`${subItem.label}-${index}`}
                  {...subItem}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

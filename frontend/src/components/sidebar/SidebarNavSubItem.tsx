export type SidebarNavSubItemProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

/**
 * Subitem de navegação da sidebar.
 * Mantém estilo compacto e realce visual quando representa a rota atual.
 */
export default function SidebarNavSubItem({
  label,
  active,
  onClick,
}: SidebarNavSubItemProps) {
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
      ].join(" ")}
    >
      {label}
    </button>
  );
}

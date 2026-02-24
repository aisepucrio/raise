import { Briefcase, Download, Eye, Home, type LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarNavItem from "./SidebarNavItem";

type SidebarRouteItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

const sidebarItems: SidebarRouteItem[] = [
  { label: "Overview", to: "/", icon: Home },
  { label: "Preview", to: "/preview", icon: Eye },
  { label: "Collect", to: "/collect", icon: Download },
  { label: "Jobs", to: "/jobs", icon: Briefcase },
];

const isActiveRoute = (pathname: string, routePath: string) => {
  if (routePath === "/") {
    return pathname === "/";
  }

  return pathname === routePath || pathname.startsWith(`${routePath}/`);
};

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="shrink-0 border-b-2 border-(--color-sidebar-border) p-6 md:min-h-dvh md:w-64 md:border-r-2 md:border-b-0">
      <div className="space-y-4">
        <div className="p-3">
          <picture>
            <source
              srcSet="/LOGO_DARK.png"
              media="(prefers-color-scheme: dark)"
            />
            <img
              src="/LOGO_LIGHT.png"
              alt="Dataminer"
              className="block h-auto w-full "
            />
          </picture>
        </div>

        <div
          className="border-t-2 border-(--color-sidebar-border)"
          aria-hidden="true"
        />

        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const active = isActiveRoute(pathname, item.to);

            return (
              <SidebarNavItem
                key={item.to}
                label={item.label}
                icon={item.icon}
                active={active}
                onClick={() => {
                  if (!active) {
                    navigate(item.to);
                  }
                }}
              />
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

import { Briefcase, Download, Eye, Home, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FormSelect } from "../form";
import SidebarNavItem from "./SidebarNavItem";
import ThemeSwitcher from "./ThemeSwitcher";

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
  const [sourceFilter, setSourceFilter] = useState("all");

  return (
    <aside className="shrink-0 border-b-2 border-(--color-sidebar-border) p-4 md:flex md:min-h-dvh md:w-[15%] md:min-w-55 md:max-w-125 md:flex-col md:border-r-2 md:border-b-0">
      <div className="space-y-4">
        <div className="p-3">
          <div className="dark:hidden">
            <img
              src="/LOGO_DARK.svg"
              alt="Dataminer"
              className="block h-auto w-full"
            />
          </div>

          <div className="hidden dark:block">
            <img
              src="/LOGO_LIGHT.svg"
              alt="Dataminer"
              className="block h-auto w-full"
            />
          </div>
        </div>

        <div
          className="border-t-2 border-(--color-sidebar-border)"
          aria-hidden="true"
        />

        <FormSelect
          id="sidebar-source-filter"
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value)}
          wrapperClassName="-ml-6 w-[calc(85%+1.5rem)]"
          className="min-h-10 rounded-none rounded-r-md py-2 text-left"
          aria-label="Selecionar origem"
        >
          <option value="github">GitHub</option>
          <option value="jira">Jira</option>
          <option value="stackoverflow">Stack Overflow</option>
        </FormSelect>

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

      <div className="mt-6 border-t-2 border-(--color-sidebar-border) pt-4 md:mt-auto">
        <ThemeSwitcher />
      </div>
    </aside>
  );
}

import {
  Briefcase,
  Download,
  Eye,
  FileText,
  Home,
  type LucideIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { sourceOptions, type SourceId } from "@/sources";
import { useSource } from "@/contexts/SourceContext";
import { Button } from "../button";
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
  { label: "Collect", to: "/collect", icon: Download },
  { label: "Preview", to: "/preview", icon: Eye },
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
  const { source, setSource } = useSource();
  const apiDocsUrl = import.meta.env.VITE_API_URL;

  return (
    <aside className="shrink-0 border-b-2 border-(--color-secondary-soft) p-4 md:flex md:min-h-dvh md:w-[15%] md:min-w-55 md:max-w-125 md:flex-col md:border-r-2 md:border-b-0">
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
          className="border-t-2 border-(--color-secondary-soft)"
          aria-hidden="true"
        />

        <FormSelect
          id="sidebar-source-filter"
          value={source}
          onChange={(event) => setSource(event.target.value as SourceId)}
          wrapperClassName="-ml-6 w-[calc(85%+1.5rem)]"
          className="min-h-10 rounded-none rounded-r-md py-2 text-left"
          aria-label="Selecionar origem"
        >
          {sourceOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
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

      <div className="mt-6 md:mt-auto">
        <Button
          text="API docs"
          icon={<FileText />}
          title={"Open API documentation "}
          disabled={!apiDocsUrl}
          onClick={() => {
            if (!apiDocsUrl) return;
            window.open(apiDocsUrl, "_blank", "noopener,noreferrer");
          }}
        />

        <div className="mt-4 border-t-2 border-(--color-secondary-soft) pt-4">
          <ThemeSwitcher />
        </div>
      </div>
    </aside>
  );
}

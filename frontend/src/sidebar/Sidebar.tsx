import {
  Briefcase,
  Download,
  Eye,
  FileText,
  Home,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  defaultSectionPreviewIdBySource,
  sectionPreviewOptionsBySource,
  sourceOptions,
  type SourceId,
} from "@/sources";
import { Button } from "@/components/button";
import { FormSelect } from "@/components/form";
import SidebarNavItem from "@/components/sidebar/SidebarNavItem";
import {
  buildSidebarSearch,
  isSidebarItemActive,
  resolveSidebarRouteContext,
} from "./sidebarNavigation";
import ThemeSwitcher from "@/components/sidebar/ThemeSwitcher";

// Tipo for items of the sidebar.
type SidebarRouteItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

// definition of the sidebar, label, rota and icon (and order).
// in the caso of the preview the logic of "active" is delegada for the subitems, that are dynamic according to source.
// the logic of "active" is baseada in the URL, without necessidade of state adicional.
const sidebarItems: SidebarRouteItem[] = [
  { label: "Overview", to: "/", icon: Home },
  { label: "Collect", to: "/collect", icon: Download },
  { label: "Preview", to: "/preview", icon: Eye },
  { label: "Jobs", to: "/jobs", icon: Briefcase },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // the sidebar usa source/section of the URL how source single of the verdade.
  // `resolveSidebarRouteContext` already returns values valid for render.
  const { source, section, normalizedSearch, shouldNormalize } =
    resolveSidebarRouteContext(location.pathname, location.search);

  // URL of the API for linkar in the "API DOCS".
  const apiDocsUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // fixes URL invalid of way silenciosa (replace), without poluir history.
    if (!shouldNormalize) return;

    navigate(
      {
        pathname: location.pathname,
        search: normalizedSearch,
      },
      { replace: true },
    );
  }, [location.pathname, navigate, normalizedSearch, shouldNormalize]);

  // Handler for change of source, reaproveitando the build centralizada of the query string.
  const handleSourceChange = (nextSource: SourceId) => {
    if (nextSource === source) return;

    // switch of source reuses the rule single of query of the sidebar.
    const nextSearch = buildSidebarSearch({
      targetPathname: location.pathname,
      currentSearch: location.search,
      source: nextSource,
      section: defaultSectionPreviewIdBySource[nextSource],
    });

    navigate({
      pathname: location.pathname,
      search: nextSearch,
    });
  };

  // function centralizada for navigation the partir of the sidebar, garantindo consistency in the build of the query string.
  const handleNavigate = (
    pathname: string,
    options?: { section?: string | null },
  ) => {
    const nextSearch = buildSidebarSearch({
      targetPathname: pathname,
      currentSearch: location.search,
      source,
      section: options?.section ?? section,
    });

    navigate({
      pathname,
      search: nextSearch,
    });
  };

  // subitems of preview are derivados dinamicamente of the source selected.
  const previewSubItems = sectionPreviewOptionsBySource[source].map(
    (sectionOption) => ({
      label: sectionOption.label,
      active: location.pathname === "/preview" && sectionOption.id === section,
      onClick: () => handleNavigate("/preview", { section: sectionOption.id }),
    }),
  );

  return (
    <aside className="shrink-0 border-b-2 border-(--color-secondary-soft) p-4 md:flex md:min-h-dvh md:w-[15%] md:min-w-55 md:max-w-125 md:flex-col md:border-r-2 md:border-b-0">
      <div className="space-y-4">
        <div className="p-3">
          {/* Logos for light/dark, usando the classe `dark` of the Tailwind for control. */}
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

        {/* separator visual between logo and navigation. */}
        <div
          className="border-t-2 border-(--color-secondary-soft)"
          aria-hidden="true"
        />

        {/* filter of source. */}
        <FormSelect
          id="sidebar-source-filter"
          variant="filled"
          value={source}
          onChange={(event) => {
            const nextSource = event.target.value as SourceId;
            handleSourceChange(nextSource);
          }}
          wrapperClassName="-ml-6 w-[calc(85%+1.5rem)]"
          className="min-h-10 rounded-none rounded-r-md py-2 text-left"
          aria-label="Selecionar source"
        >
          {sourceOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </FormSelect>

        {/* navigation main of the sidebar. */}
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const active = isSidebarItemActive(location.pathname, item.to);
            {
              /* in preview, passa subitems dynamic baseados in the source selected. */
            }
            const subItems =
              item.to === "/preview" ? previewSubItems : undefined;

            return (
              <SidebarNavItem
                key={item.to}
                label={item.label}
                icon={item.icon}
                active={active}
                subItems={subItems}
                onClick={() => {
                  if (!active) {
                    handleNavigate(item.to);
                  }
                }}
              />
            );
          })}
        </nav>
      </div>

      {/* button "API DOCS" */}
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

        {/* separator visual + modificador of theme*/}
        <div className="mt-4 border-t-2 border-(--color-secondary-soft) pt-4">
          <ThemeSwitcher />
        </div>
      </div>
    </aside>
  );
}

import {
  Briefcase,
  Download,
  Eye,
  FileText,
  Database,
  Home,
  KeyRound,
  Lock,
  LogOut,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  defaultSectionPreviewIdBySource,
  isSectionPreviewFolded,
  isSourceAvailable,
  sourceEntityLabels,
  sectionPreviewOptionsBySource,
  sourceOptions,
  type SourceId,
} from "@/sources";
import {
  apiUrl,
  endpoints,
  hasRole,
  queryClient,
  useLogoutMutation,
  useMeQuery,
  type UserRole,
} from "@/data";
import { Button } from "@/components/button";
import { FormSelect } from "@/components/form";
import { SidebarNavItem, ThemeSwitcher } from "@/components/sidebar";
import {
  buildSidebarSearch,
  isSidebarItemActive,
  resolveSidebarRouteContext,
} from "./sidebarNavigation";

// Type for sidebar items.
type SidebarRouteItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  // Shown only to users with at least this role.
  role?: UserRole;
};

// Sidebar definition: label, route, icon, and order, in two groups.
// In Preview, "active" logic is delegated to subitems, which are source-driven.
// Active state is URL-based, without extra local state.

// Screens of the platform picked in the source selector above them. Each is
// a generic shell that loads the source's module (src/sources/registry.ts);
// the entities page is also named by the source (Repositories, Projects, Tags).
function buildSourceItems(source: SourceId): SidebarRouteItem[] {
  return [
    { label: "Overview", to: "/", icon: Home },
    { label: "Collect", to: "/collect", icon: Download },
    { label: "Preview", to: "/preview", icon: Eye },
    {
      label: sourceEntityLabels[source].title,
      to: "/entities",
      icon: Database,
      role: "admin",
    },
  ];
}

// Screens of the whole system, independent of the selected source.
const systemItems: SidebarRouteItem[] = [
  { label: "Jobs", to: "/jobs", icon: Briefcase },
  {
    label: "Credentials",
    to: "/credentials",
    icon: KeyRound,
    role: "researcher",
  },
  { label: "Users", to: "/register", icon: UserPlus, role: "admin" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  // Whether Preview lists its folded (less used) sections too.
  const [showAllSections, setShowAllSections] = useState(false);

  // Sidebar uses source/section from the URL as the single source of truth.
  // `resolveSidebarRouteContext` already returns values valid for render.
  const { source, section, normalizedSearch, shouldNormalize } =
    resolveSidebarRouteContext(location.pathname, location.search);

  // Interactive API docs, served by the API on the same origin.
  const apiDocsUrl = apiUrl(endpoints.apiDocs());

  const { data: currentUser } = useMeQuery();
  const logoutMutation = useLogoutMutation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        queryClient.clear();
        navigate("/login", { replace: true });
      },
    });
  };

  useEffect(() => {
    // Silently fixes invalid URL (replace) without polluting history.
    if (!shouldNormalize) return;

    navigate(
      {
        pathname: location.pathname,
        search: normalizedSearch,
      },
      { replace: true },
    );
  }, [location.pathname, navigate, normalizedSearch, shouldNormalize]);

  // Handles source changes by reusing centralized query-string building.
  const handleSourceChange = (nextSource: SourceId) => {
    if (nextSource === source) return;

    // Source switching reuses the sidebar's single query rule.
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

  // Centralized sidebar navigation to guarantee consistent query-string building.
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

  // Preview subitems are derived dynamically from the selected source.
  // Unavailable sources have no sections to preview. Less used sections are
  // folded under a "Show N more" toggle, which stays open while one of them
  // is the current page so it stays visible.
  const previewOptions: readonly {
    id: string;
    label: string;
    group?: string;
  }[] = isSourceAvailable(source) ? sectionPreviewOptionsBySource[source] : [];
  const isFolded = (id: string) =>
    isSectionPreviewFolded(source, id as typeof section);
  const foldedCount = previewOptions.filter((o) => isFolded(o.id)).length;
  const isOnFoldedSection =
    location.pathname === "/preview" && isFolded(section);
  const showFolded = showAllSections || isOnFoldedSection;
  const previewSubItems = [
    ...previewOptions
      .filter((o) => showFolded || !isFolded(o.id))
      .map((sectionOption) => ({
        label: sectionOption.label,
        group: sectionOption.group,
        active:
          location.pathname === "/preview" && sectionOption.id === section,
        onClick: () =>
          handleNavigate("/preview", { section: sectionOption.id }),
      })),
    ...(foldedCount > 0 && !isOnFoldedSection
      ? [
          {
            label: showFolded ? "Show fewer" : `Show ${foldedCount} more`,
            muted: true,
            active: false,
            onClick: () => setShowAllSections((value) => !value),
          },
        ]
      : []),
  ];

  const renderItem = (item: SidebarRouteItem) => {
    const active = isSidebarItemActive(location.pathname, item.to);
    // In preview, passes dynamic subitems based on selected source.
    const subItems = item.to === "/preview" ? previewSubItems : undefined;

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
  };

  return (
    // On wide screens the navigation scrolls on its own (Preview can list many
    // sections) while the account footer stays pinned; on narrow screens the
    // whole sidebar scrolls within part of the viewport.
    <aside className="max-h-[45dvh] shrink-0 overflow-y-auto border-b-2 border-(--color-secondary-soft) p-4 md:flex md:h-dvh md:max-h-none md:w-[15%] md:min-w-60 md:max-w-125 md:flex-col md:overflow-visible md:border-r-2 md:border-b-0">
      <div className="space-y-4 md:-ml-4 md:min-h-0 md:flex-1 md:overflow-x-hidden md:overflow-y-auto md:pb-2 md:pl-4">
        <div className="p-3">
          {/* Light/dark logos controlled by Tailwind's `dark` class. */}
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

        {/* Visual separator between logo and navigation. */}
        <div
          className="border-t-2 border-(--color-secondary-soft)"
          aria-hidden="true"
        />

        {/* Source filter: scopes the source group below it. */}
        <div>
          <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-(--color-secondary-muted) uppercase">
            Platform
          </h2>
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
        </div>

        {/* Navigation of the selected source. */}
        <nav aria-label="Platform" className="flex flex-col gap-1">
          {buildSourceItems(source)
            .filter(
              (item) => !item.role || hasRole(currentUser?.role, item.role),
            )
            .map(renderItem)}
        </nav>

        {/* Navigation of the whole system, set apart from the source group. */}
        <div
          className="border-t-2 border-(--color-secondary-soft)"
          aria-hidden="true"
        />
        <div>
          <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-(--color-secondary-muted) uppercase">
            System
          </h2>
          <nav aria-label="System" className="flex flex-col gap-1">
            {systemItems
              .filter(
                (item) => !item.role || hasRole(currentUser?.role, item.role),
              )
              .map(renderItem)}
          </nav>
        </div>
      </div>

      {/* Current user, logout, API docs and theme. */}
      <div className="mt-6 space-y-3 md:mt-0 md:shrink-0 md:border-t-2 md:border-(--color-secondary-soft) md:pt-4">
        {currentUser ? (
          <div className="flex items-center justify-between gap-2 px-1 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold text-(--color-secondary)">
                {currentUser.username}
              </p>
              <p className="text-xs text-(--color-secondary-muted)">
                {currentUser.role}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                fullWidth={false}
                className="w-9 min-h-8.5 px-0 py-0"
                icon={<Lock />}
                aria-label="Change password"
                title="Change password"
                onClick={() => handleNavigate("/password")}
              />
              <Button
                fullWidth={false}
                className="w-9 min-h-8.5 px-0 py-0"
                icon={<LogOut />}
                aria-label="Log out"
                title="Log out"
                disabled={logoutMutation.isPending}
                onClick={handleLogout}
              />
            </div>
          </div>
        ) : null}

        {/* API docs and the theme toggle share one compact row. */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            text="API docs"
            icon={<FileText />}
            title="Open the API documentation"
            className="flex-1"
            onClick={() => {
              window.open(apiDocsUrl, "_blank", "noopener,noreferrer");
            }}
          />
          <ThemeSwitcher />
        </div>
      </div>
    </aside>
  );
}

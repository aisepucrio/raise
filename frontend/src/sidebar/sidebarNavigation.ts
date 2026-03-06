import type { SectionPreviewIdBySource, SourceId } from "@/sources";
import {
  resolveSectionId,
  resolveSourceId,
} from "@/lib/source-section-resolver";

// Types and functions related to sidebar navigation.
type SidebarRouteContext = {
  source: SourceId;
  section: SectionPreviewIdBySource[SourceId];
  normalizedSearch: string;
  shouldNormalize: boolean;
};

// Minimal structure used to compute navigation query strings.
type BuildSidebarSearchParams = {
  targetPathname: string;
  currentSearch: string;
  source: SourceId;
  section?: string | null;
};

// Aux: converts URLSearchParams for query string with "?".
function toSearchString(searchParams: URLSearchParams) {
  const search = searchParams.toString();
  return search ? `?${search}` : "";
}

// Helper: checks whether a main sidebar item is active.
export function isSidebarItemActive(pathname: string, routePath: string) {
  if (routePath === "/") {
    return pathname === "/";
  }

  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}

// Helper: identifies whether the current route is preview.
function isPreviewRoute(pathname: string) {
  return pathname === "/preview" || pathname.startsWith("/preview/");
}

// Reads source/section from URL and returns values already sanitized for the UI.
// Also indicates whether the URL needs normalization (for example: invalid source).
export function resolveSidebarRouteContext(
  pathname: string,
  search: string,
): SidebarRouteContext {
  const searchParams = new URLSearchParams(search);
  const source = resolveSourceId(searchParams.get("source"));
  const section = resolveSectionId(source, searchParams.get("section"));

  let shouldNormalize = false;

  if (searchParams.get("source") !== source) {
    searchParams.set("source", source);
    shouldNormalize = true;
  }

  if (isPreviewRoute(pathname) && searchParams.get("section") !== section) {
    searchParams.set("section", section);
    shouldNormalize = true;
  }

  if (!isPreviewRoute(pathname) && searchParams.has("section")) {
    searchParams.delete("section");
    shouldNormalize = true;
  }

  return {
    source,
    section,
    normalizedSearch: toSearchString(searchParams),
    shouldNormalize,
  };
}

// Generates query strings for sidebar-triggered navigations.
// rules:
// - always preserves `source`
// - in Preview keeps/resolves `section` for the source provided
// - outside of preview removes `section`
export function buildSidebarSearch({
  targetPathname,
  currentSearch,
  source,
  section,
}: BuildSidebarSearchParams) {
  const searchParams = new URLSearchParams(currentSearch);
  searchParams.set("source", source);

  if (isPreviewRoute(targetPathname)) {
    searchParams.set(
      "section",
      resolveSectionId(source, section ?? searchParams.get("section")),
    );
  } else {
    searchParams.delete("section");
  }

  return toSearchString(searchParams);
}

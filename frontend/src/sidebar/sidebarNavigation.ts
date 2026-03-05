import type { SectionPreviewIdBySource, SourceId } from "@/sources";
import {
  resolveSectionId,
  resolveSourceId,
} from "@/lib/source-section-resolver";

// types and functions relacionados to navigation of the sidebar.
type SidebarRouteContext = {
  source: SourceId;
  section: SectionPreviewIdBySource[SourceId];
  normalizedSearch: string;
  shouldNormalize: boolean;
};

// Estrutura minimum for calcular the query string of navigation.
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

// Aux: verifica se the item main of the sidebar is ativo.
export function isSidebarItemActive(pathname: string, routePath: string) {
  if (routePath === "/") {
    return pathname === "/";
  }

  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}

// Aux: identifica se the rota atual is of preview.
function isPreviewRoute(pathname: string) {
  return pathname === "/preview" || pathname.startsWith("/preview/");
}

// reads source/section of the URL and returns values already sanitized for the UI.
// also sinaliza se the URL precisa ser fixed (ex.: source invalid).
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

// generates the query string for navigations disparadas pela sidebar.
// rules:
// - always preserva `source`
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

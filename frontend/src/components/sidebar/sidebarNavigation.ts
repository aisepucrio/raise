import type { SectionPreviewIdBySource, SourceId } from "@/sources";
import {
  resolveSectionId,
  resolveSourceId,
} from "@/lib/source-section-resolver";

// Tipos e funções relacionados à navegação da sidebar.
type SidebarRouteContext = {
  source: SourceId;
  section: SectionPreviewIdBySource[SourceId];
  normalizedSearch: string;
  shouldNormalize: boolean;
};

// Estrutura mínima para calcular a query string de navegação.
type BuildSidebarSearchParams = {
  targetPathname: string;
  currentSearch: string;
  source: SourceId;
  section?: string | null;
};

// Aux: converte URLSearchParams para query string com "?".
function toSearchString(searchParams: URLSearchParams) {
  const search = searchParams.toString();
  return search ? `?${search}` : "";
}

// Aux: verifica se o item principal da sidebar está ativo.
export function isSidebarItemActive(pathname: string, routePath: string) {
  if (routePath === "/") {
    return pathname === "/";
  }

  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}

// Aux: identifica se a rota atual é de Preview.
function isPreviewRoute(pathname: string) {
  return pathname === "/preview" || pathname.startsWith("/preview/");
}

// Lê source/section da URL e devolve valores já saneados para a UI.
// Também sinaliza se a URL precisa ser corrigida (ex.: source inválido).
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

// Gera a query string para navegações disparadas pela sidebar.
// Regras:
// - sempre preserva `source`
// - em Preview mantém/resolve `section` para o source informado
// - fora de Preview remove `section`
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

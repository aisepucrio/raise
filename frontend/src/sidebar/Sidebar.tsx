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

// Tipo para itens da sidebar.
type SidebarRouteItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

// Definição da sidebar, label, rota e ícone (e ordem).
// No caso do preview a lógica de "active" é delegada para os subitens, que são dinâmicos conforme source.
// A lógica de "active" é baseada na URL, sem necessidade de estado adicional.
const sidebarItems: SidebarRouteItem[] = [
  { label: "Overview", to: "/", icon: Home },
  { label: "Collect", to: "/collect", icon: Download },
  { label: "Preview", to: "/preview", icon: Eye },
  { label: "Jobs", to: "/jobs", icon: Briefcase },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // A sidebar usa source/section da URL como fonte única da verdade.
  // `resolveSidebarRouteContext` já devolve valores válidos para render.
  const { source, section, normalizedSearch, shouldNormalize } =
    resolveSidebarRouteContext(location.pathname, location.search);

  // URL da API para linkar no "API DOCS".
  const apiDocsUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // Corrige URL inválida de forma silenciosa (replace), sem poluir histórico.
    if (!shouldNormalize) return;

    navigate(
      {
        pathname: location.pathname,
        search: normalizedSearch,
      },
      { replace: true },
    );
  }, [location.pathname, navigate, normalizedSearch, shouldNormalize]);

  // Handler para mudança de source, reaproveitando a construção centralizada da query string.
  const handleSourceChange = (nextSource: SourceId) => {
    if (nextSource === source) return;

    // Troca de source reaproveita a regra única de query da sidebar.
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

  // Função centralizada para navegação a partir da sidebar, garantindo consistência na construção da query string.
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

  // Subitens de Preview são derivados dinamicamente da source selecionada.
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
          {/* Logos para light/dark, usando a classe `dark` do Tailwind para controle. */}
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

        {/* Separador visual entre logo e navegação. */}
        <div
          className="border-t-2 border-(--color-secondary-soft)"
          aria-hidden="true"
        />

        {/* Filtro de source. */}
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
          aria-label="Selecionar origem"
        >
          {sourceOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </FormSelect>

        {/* Navegação principal da sidebar. */}
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const active = isSidebarItemActive(location.pathname, item.to);
            {
              /* Em preview, passa subitens dinâmicos baseados na source selecionada. */
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

      {/* Botão "API DOCS" */}
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

        {/* Separador visual + modificador de tema*/}
        <div className="mt-4 border-t-2 border-(--color-secondary-soft) pt-4">
          <ThemeSwitcher />
        </div>
      </div>
    </aside>
  );
}

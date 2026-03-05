# Organização geral do frontend e como criar um novo módulo

Este README centraliza a arquitetura do frontend e o fluxo para criar uma nova source (módulo completo de `overview + collect + preview + data`).

## Stack e setup rápido

- `React + Vite` -> base da aplicação SPA.
- `react-router-dom` -> roteamento de páginas.
- `@tanstack/react-query` -> cache, loading e sincronização de dados.
- `axios` -> cliente HTTP para API.
- `Tailwind + componentes internos` -> UI reutilizável.
- `Storybook` -> catálogo/validação visual de componentes.

Scripts principais:

- `npm run dev` -> sobe ambiente local.
- `npm run build` -> gera build de produção.
- `npm run storybook` -> sobe documentação visual dos componentes.

Variável de ambiente (colocar na .env):

- `VITE_API_URL` -> URL base da API consumida em `src/data/api/apiClient.ts` - rota do backend.

## Mapa de execução da aplicação (arquivos principais)

- `src/main.tsx` -> injeta `ThemeProvider` (tema claro/escuro), `QueryClientProvider` (tanstack query), `RouterProvider` (roteamento) e `Toast`(avisos); consome `queryClient` pelo barrel `@/data`.
- `src/router.tsx` -> define as rotas `/overview`, `/collect`, `/preview` e `/jobs`.
- `src/layout.tsx` -> renderiza estrutura base `Sidebar + Outlet`.
- `src/sidebar/Sidebar.tsx` -> configuração da sidebar e da lógica de troca de página, usa `source/section` da URL como fonte única da verdade.
- `src/pages/OverviewPage.tsx` -> escolhe o módulo de overview pela `source` atual.
- `src/pages/CollectPage.tsx` -> escolhe o módulo de collect pela `source` atual.
- `src/pages/PreviewPage.tsx` -> escolhe o módulo de preview por `source + section`.
- `src/pages/JobsPage.tsx` -> lista jobs globais e executa ações de stop/restart.
- `src/pages/NotFound.tsx` -> fallback 404 da aplicação.
- `src/data/index.ts` -> ponto único de entrada da camada de dados para páginas e componentes (`hooks`, `types`, `queryClient`, helpers e tipos de section).

## Rotas e query params (fonte da navegação)

- `source` -> define qual integração está ativa (`github`, `jira`, `stackoverflow`).
- `section` -> define qual subárea da preview está ativa (somente em `/preview`).

![Figure1-README](public/Figure1-README.png)

Arquivos que controlam a regra:

- `src/sources/index.ts` -> contrato global de ids, labels, defaults e sections por source.
- `src/lib/source-section-resolver.ts` -> normaliza `source/section` inválidos para valores válidos.
- `src/sidebar/Sidebar.tsx` e `src/sidebar/sidebarNavigation.ts`-> preserva `source`, mantém `section` só em preview e remove fora dela, também corrige URL inválida automaticamente com `replace`.

## Organização de pastas (visão arquitetural)

```txt
src/
  components/ -> UI compartilhada (cards, tabelas, filtros, modais, etc.), cada componente está em uma pasta e possuí documentação com storybook.
  pages/      -> páginas de rota (overview, collect, preview, jobs)
  sidebar/    -> navegação lateral e regras de URL
  sources/    -> módulos de UI por source
  data/       -> camada de API + React Query + módulos de domínio por source (comunicação com o back)
  lib/        -> utilitários de suporte (resolvers, tema, helpers)
```

## Padrão de componentes + Storybook

Para manter consistência de documentação e uso:

- Todo componente compartilhado deve ficar em `src/components/<nome-do-componente>/`.
- Dentro da pasta, manter no mínimo `<Componente>.tsx` (implementação), `<Componente>.stories.tsx` (documentação/uso no Storybook) e `index.ts` (exportar somente o que deve ser exposto para consumo externo).
- Imports externos devem apontar para o barrel da pasta (`@/components/<nome-do-componente>`), evitando importar arquivos internos diretamente.

## Camada `src/data` (backend + cache)

### `src/data/api`

- `apiClient.ts` -> instancia axios com base URL e interceptor que devolve `res.data`.
- `endpoints.ts` -> centraliza rotas HTTP de dashboard, preview, collect e jobs.

### `src/data/query`

- `client.ts` -> configura `QueryClient` único da aplicação.
- `keys.ts` -> gera query keys padronizadas por source + keys de jobs.
- `invalidation.ts` -> concentra invalidadores reutilizáveis (ex.: jobs).
- `errors.ts` -> normaliza objetos de erro para mensagem amigável.

### `src/data/modules`

Cada domínio segue o mesmo padrão:

- `<source>Types.ts` -> concentra contratos de params, payloads e respostas.
- `<source>Service.ts` -> contém apenas chamadas HTTP de cada endpoint do domínio.
- `<source>Queries.ts` -> encapsula `useQuery` com `queryKey` padronizada - as queries são operações usadas para buscar/ler informações.
- `<source>Mutations.ts` -> encapsula `useMutation` e invalidações pós-ação - as mutations são operações usadas para criar, editar ou remover informações.
- `index.ts` -> agrega e reexporta `queries`, `mutations` e `types` do módulo.

Barrel de consumo:

- `src/data/index.ts` -> é o ponto único de consumo para páginas/componentes: reexporta hooks de queries/mutations, types de módulos, tipos de `section`, `queryClient` e helper de erro.
- Padrão de import na UI -> preferir sempre `@/data`; evitar import direto de `@/data/modules/*`, `@/data/api/*` e `@/data/query/*`.

Fluxo padrão:

`Componente/Página (importa de "@/data")` -> `hook Query/Mutation` -> `Service` -> `endpoints + apiClient` -> `Backend`

## Camada `src/sources` (UI por source)

Papel desta camada:

- `Overview` -> filtros + gráfico + cards de métricas.
- `Collect` -> formulário de entrada e disparo da coleta.
- `Preview` -> tabela paginada com busca, ordenação, export e filtros.

Arquivos centrais:

- `src/sources/index.ts` -> contrato tipado de sources/sections/labels/defaults (utilizado para que todo o frontend tenha apenas uma fonte de consumo padronizada).
- `src/sources/registry.ts` -> registry que liga source aos componentes reais da UI (utilizados para mapeamento em OverviewPage, CollectPage e PreviewPage).

Shareds para funções de lógica, reutilizados por múltiplos sources:

- `sources/shared/AllShared.ts` -> helpers genéricos de opção para selects.
- `sources/shared/OverviewShared.ts` -> builders de filtros/cards/séries do overview.
- `sources/shared/CollectShared.ts` -> helpers de tags e feedback de coleta.
- `sources/shared/PreviewShared.ts` -> helpers de tabela, sort, export e feedback de preview.

Componentes compostos usados direto na construção das páginas:

- `src/components/overview/*` -> componentes específicos de overview que já agrupam blocos menores (filtros, layout, gráfico e métricas) para cada módulo configurar.
- `src/components/collect/*` -> componentes específicos de collect que já agrupam blocos menores (header, tags, datas e ações) para cada módulo configurar.
- `src/components/preview/*` -> componentes específicos de preview que já agrupam blocos menores (header, tabela, modal e export) para cada módulo configurar.
- `Padrão recorrente, não obrigatório` -> o projeto costuma seguir esse modelo para acelerar novos módulos, mas cada source pode sair dele quando fizer sentido.

## Como criar uma nova source/módulo (checklist)

Exemplo: adicionar `reddit`.

### 1. Declarar a source no contrato global

- `src/sources/index.ts` -> adicionar `reddit` em `sourceIds`.
- `src/sources/index.ts` -> adicionar `sectionPreviewIdsBySource.reddit`.
- `src/sources/index.ts` -> adicionar labels em `sourceLabels` e `sectionPreviewLabelsBySource`.
- `src/sources/index.ts` -> definir `defaultSectionPreviewIdBySource.reddit`.

Resultado direto:

- `queryKeys.reddit.*` passa a existir automaticamente (fábrica baseada em `sourceIds`).
- Sidebar e filtros passam a reconhecer a nova source.

### 2. Criar UI da source em `src/sources/reddit`

Estrutura recomendada:

```txt
src/sources/reddit/
  RedditOverview.tsx
  RedditCollect.tsx
  RedditPreview.tsx
```

Padrão prático (recorrente, não obrigatório):

- `Overview` -> usar `OverviewLayout`, `OverviewFilters`, `OverviewChartSection`, `OverviewStatsSection`.
- `Collect` -> usar `CollectWrapper`, `CollectHeader`, `CollectTagsSection`, `CollectDateSection`, `CollectActions`.
- `Preview` -> usar `PreviewWrapper`, `PreviewHeader`, `PreviewTable`, `PreviewCellModal`.

### 3. Registrar componentes no registry

- `src/sources/registry.ts` -> adicionar `reddit` em `sourceUiModules` com `collect` e `overview`.
- `src/sources/registry.ts` -> adicionar sections em `sourceSectionPreviewUiModules.reddit`.

Sem esse passo:

- `OverviewPage`, `CollectPage` e `PreviewPage` não conseguem renderizar a nova source.

### 4. Criar data module em `src/data/modules/reddit`

Criar arquivos (utilize os outros exemplos como guia):

- `redditTypes.ts` -> contratos tipados de params, payloads e respostas.
- `redditService.ts` -> endpoints + requests.
- `redditQueries.ts` -> hooks `useQuery` usando `queryKeys.reddit.*`.
- `redditMutations.ts` -> hooks `useMutation` (collect/export/etc.) + invalidações.
- `index.ts` -> reexport de `queries`, `mutations` e `types` do módulo.

Pontos de implementação:

- `Types` -> manter contratos coesos e compartilháveis entre UI, hooks e service.
- `Service` -> manter assinatura de params explícita, consumir os tipos de `redditTypes.ts` e evitar declarar tipos no próprio service.
- `Queries` -> usar `queryKey` estável e `signal` do React Query no `queryFn`.
- `Mutations` -> invalidar jobs quando ação iniciar/alterar coleta.

### 5. Validar endpoints e tipagem de sections

- `src/data/api/endpoints.ts` -> confirmar que a source nova está coberta no contrato e rotas necessárias.
- `previewList(source, section)` -> passa a aceitar as sections tipadas da source adicionada no contrato.

### 6. Atualizar barrel central de dados

- `src/data/index.ts` -> importar o novo módulo (`./modules/reddit`) e expor `redditModule = { queries, mutations }`.
- `src/data/index.ts` -> reexportar hooks, types e sections necessários para manter o consumo da UI centralizado em `@/data`.

### 7. Rotas

- Se a source usa páginas padrão (`overview/collect/preview`) -> não criar rota nova.
- Só editar `src/router.tsx` -> quando existir uma página nova fora do fluxo padrão.

### 8. Checklist de validação final

- Sidebar mostra a nova source e mantém URL consistente.
- Overview troca filtros e carrega cards/gráfico corretamente.
- Collect dispara mutation e redireciona/atualiza jobs.
- Preview troca section, paginação e ordenação sem perder estado essencial.
- Export da preview gera arquivo e feedback visual.
- `npm run lint` conclui sem erro.

## Referências de implementação para copiar padrão

- `src/data/modules/github/*` -> melhor referência de módulo de dados completo.
- `src/sources/github/*` -> melhor referência de UI completa por source.
- `src/sources/registry.ts` -> referência de registro obrigatório no shell da app.
- `src/sidebar/sidebarNavigation.ts` -> referência de regras de query string.

# Raise frontend architecture

This document describes the frontend **as implemented**, including its coupling
to the legacy Django/Celery API. Section 9 outlines work for compatibility with
the Go backend; those items are not implemented frontend features. For setup,
commands, and serving, see [README.md](README.md).

## 1. Stack and runtime

The app uses React 19, React Router 7, TanStack Query 5, and Axios. Vite 7 builds
the TypeScript/TSX application. Tailwind CSS 4 and CSS variables style internal
components; Radix UI supplies primitives, Lucide supplies icons, Nivo renders
line charts, Motion supplies animation, and Sonner supplies toast notifications.
Storybook 10 provides component examples; Vitest 4 runs unit tests.

[`src/main.tsx`](src/main.tsx) mounts the app in React StrictMode with:

1. `ThemeProvider` from `src/lib/theme-context.tsx`.
2. One `QueryClientProvider` using the shared `queryClient` exported by `@/data`.
3. `RouterProvider` and the global toast renderer.

[`src/layout.tsx`](src/layout.tsx) composes the sidebar and router `Outlet`.
The root layout owns the viewport; individual screens constrain and scroll
their content within it. Router errors and unmatched routes use `NotFound`.

The custom theme context initialises from root `light`/`dark` classes or the
browser's colour-scheme preference, then updates the root classes and
`data-theme`. Theme selection is held in memory; it is not persisted to storage.

## 2. Code organisation and boundaries

All paths below are relative to `frontend/`. The `@/` alias resolves to `src/`
in Vite, TypeScript, and Vitest.

| Path | Responsibility |
|---|---|
| `src/pages/` | Route shells; select source UI modules. `JobsPage` owns the global jobs screen. |
| `src/sidebar/` | Navigation, source/section selection, query-string normalisation. |
| `src/sources/index.ts` | Source IDs, labels, preview sections, defaults, and related types/options. |
| `src/sources/registry.ts` | Map source and preview-section IDs to React components. |
| `src/sources/{github,jira,stackoverflow}/` | Source-specific overview, collect, and preview UI. |
| `src/sources/shared/` | Shared screen helpers: selectors, overview models, collection feedback/URL parsing, table state and downloads. |
| `src/data/api/` | Axios transport and central endpoint builders. |
| `src/data/query/` | Query client, cache keys, invalidation, and error-message extraction. |
| `src/data/modules/{github,jira,stackoverflow,jobs}/` | Domain types, HTTP services, query hooks, mutation hooks, and barrels. |
| `src/data/modules/shared.ts` | Shared dashboard/date-range/collection types and date-bound adapters. |
| `src/data/index.ts` | Public data-layer entry point for UI imports (`@/data`). |
| `src/components/` | Reusable primitives and composed overview/collect/preview components, usually with stories and barrel exports. |
| `src/lib/` | Theme context, source/section resolver, and utilities such as `cn`. |
| `src/index.css` | Tailwind imports, colour/theme tokens, and shared styling. |
| `public/` | Static assets such as logos. |
| `.storybook/` | Story discovery, docs addon, global CSS, and story wrappers. |

The existing consumption convention is:

```text
Page -> source UI -> @/data query/mutation hook -> domain service
     -> endpoint builder + Axios -> backend
```

Pages and source UI should consume hooks/types through `@/data`. Services own
HTTP calls; query hooks own cache identity and fetching; mutations own write
calls and invalidation. Shared UI should take props rather than introduce
source-specific requests. Prefer component-folder barrels for public imports.
These are conventions, not enforced import rules: some code imports component
internals directly, and some data modules import UI export types.

## 3. Routing and state

[`src/router.tsx`](src/router.tsx) uses `createBrowserRouter`, so hosting must
fall back to `index.html` for client routes.

| Route | Component and selection |
|---|---|
| `/`, `/overview` | `OverviewPage` selects `sourceUiModules[source].overview`. |
| `/collect` | `CollectPage` selects `sourceUiModules[source].collect`. |
| `/preview` | `PreviewPage` selects `sourceSectionPreviewUiModules[source][section]`. |
| `/jobs` | `JobsPage`, independent of selected source. |

| Source | Preview sections (first is the default) |
|---|---|
| `github` | `issues`, `pull-requests`, `commits`, `users` |
| `jira` | `users`, `issues`, `comments`, `sprints` |
| `stackoverflow` | `questions` |

The URL owns the selected integration (`source`) and preview subsection
(`section`). `source-section-resolver.ts` falls back to GitHub for an invalid
or missing source, and to the selected source's first section for an invalid
or missing section. Sidebar helpers preserve `source`, keep a valid `section`
only on Preview, and remove `section` elsewhere. The sidebar replaces invalid
query strings with normalised ones, retaining other query parameters.

Repository/project/tag selections, dates, search, page size, sort, hidden
columns, modal contents, and collection forms live in component state. They
are not encoded in the URL or persisted. Server data lives in TanStack Query.
Changing pages or source components can therefore reset local screen state.

## 4. Data access and cache

[`apiClient.ts`](src/data/api/apiClient.ts) creates one Axios instance with
`VITE_API_URL` as its base URL and JSON content type. Its response interceptor
returns `res.data`, so services receive the response body rather than the Axios
response wrapper. Rejections become `err.response ?? err`.

There is currently no login screen, auth provider, route guard, bearer-token
interceptor, session bootstrap, or explicit `withCredentials` configuration.
The frontend does not implement the legacy backend's JWT authentication flow.

Each source data module follows this pattern:

- `*Types.ts`: request/response contracts, generally handwritten.
- `*Service.ts`: endpoint calls; most source read calls accept `AbortSignal`.
- `*Queries.ts`: `useQuery`, keys, conditional enablement, and small adapters.
- `*Mutations.ts`: collect/export actions and successful-action invalidation.
- `index.ts`: module exports; `src/data/index.ts` exposes the UI-facing API.

The query client retries failed reads once, keeps data fresh for 30 seconds,
and disables refetch on window focus. Cache keys include the source, operation,
section where applicable, and request parameters. For example:

```ts
["github", "preview", "issues", params]
["github", "overview", params ?? null]
["jobs", "list"]
```

Preview hooks use `keepPreviousData` during page/filter changes. GitHub/Jira
date-bound queries require a selected repository/project; Stack Overflow can
request bounds for all tags. `toDateBounds` adapts `date_range.min_date` and
`max_date` for the date inputs.

Collection, stop, and restart mutations invalidate the `["jobs"]` prefix.
They do not invalidate dashboards, previews, or date ranges after mining
finishes. Jobs polling is implemented by `JobsPage` with a five-second interval
calling `refetch`, rather than a query-level `refetchInterval`.

`getQueryErrorMessage` reads nested `error`/`message` fields (including response
`data`) and falls back to a caller-supplied message. Screens use inline errors
and/or shared toast helpers. There is no general adapter for huma's error body.

## 5. Legacy HTTP contract

[`endpoints.ts`](src/data/api/endpoints.ts) is the route catalogue. Below,
`{source}` is `github`, `jira`, or `stackoverflow`; `{section}` is from section 3.
Trailing slashes are intentional for Django's routing/CORS behaviour.

| Operation | Method and path | Contract consumed/sent by the frontend |
|---|---|---|
| Overview/catalogue | `GET /api/{source}/dashboard/` | `entities`, `selectedEntity`, `cards`, `time_mined`. Also supplies entity options for preview filters. |
| Chart | `GET /api/{source}/dashboard/graph/` | `time_series: {labels, datasets}`, optional `selectedEntity`/`interval`. |
| Date bounds | `GET /api/{source}/date-range/` | `date_range: {min_date, max_date}`. |
| Start collection | `POST /api/{source}/collect/` | Source form payload described below. Success navigates to `/jobs?source=...`; response is not used as a collection model. |
| Preview | `GET /api/{source}/{section}/` | `count` and `results`; rows are `Record<string, unknown>`. |
| Export | `POST /api/{source}/export/` | Blob response, downloaded with a generated filename. Source differences below. |
| Jobs | `GET /api/jobs/` | `{count, results}` of task records. |
| Stop task | `DELETE /api/jobs/tasks/{taskId}/` | Task ID from the jobs row. |
| Restart | `POST /api/jobs/restart-collection/{taskId}/` | Task ID from the jobs row. |

### Filters and pagination

Overview/chart use `start_date`, `end_date`, and source scope:
`repository_id` (GitHub), `project_id` (Jira), or `tag` (Stack Overflow).
Charts also send an interval (`day`, `week`, `month`, `year`) chosen by the
shared overview helpers from selected dates/available bounds.

Previews send one-based `page`, `page_size`, optional `search`, and `ordering`
(`field` ascending, `-field` descending). Scope/date parameters differ:

| Source | Scope | Date filters by section |
|---|---|---|
| GitHub | `repository` | Issues/PRs: `github_created_at__gte/__lte`; commit date filtering uses `date__gte/__lte`. Types also allow those date fields for users; individual section wrappers control whether date filters appear. |
| Jira | `project` | Sprints: `startDate__gte`, `endDate__lte`; users: `updated_at__gte/__lte`; issues/comments: `created__gte/__lte`. |
| Stack Overflow | `question_id` | `creation_date__gte/__lte`. |

These names are backend contracts, not a common schema. Do not infer a new Go
filter name by copying a Django lookup suffix.

### Collection payloads

GitHub and Stack Overflow use `StandardCollectBody` with `targets`,
`collect_types`, `start_date`, `end_date`, `filters`, and `options`.

- **GitHub:** targets are `owner/repo`; metadata is always requested alongside
  selected optional types. The form uses `options: {depth: "basic"}` and empty
  filters. Blank dates become `null`; provided dates are converted to ISO
  timestamps by `formatDateGitHub`, which currently sets local time to
  `13:42:00.888` before serialisation.
- **Jira:** the form sends that same envelope, with `domain/PROJECT` targets,
  `collect_types: ["issues"]`, date strings or `null`, and empty filters/options.
  **Its declared `JiraCollectBody` disagrees:** it specifies
  `projects: [{jira_domain, project_key}]` and optional date strings instead.
- **Stack Overflow:** targets are optional tags; dates are required by the UI.
  `collect_types` is `["questions"]`; `options.mode` is `default` or `advanced`.
  Advanced filters include score bounds, accepted/answer/view criteria, title,
  closed/migrated flags, excluded tags, and user.

Modals normalise target inputs and reject duplicates. The pure URL parsers in
`src/sources/shared/parseCollectUrl.ts` accept GitHub repository links, Jira
project/issue links, and Stack Overflow tag links; their tests are adjacent.

### Exports

GitHub forwards `{format, table, date_type?}` and can request JSON or CSV.
The active preview repository/date/search filters are not included in that
payload, so exporting is not a download of the currently filtered table.

Jira's UI and mutation construct an export body, but its service still takes
request options and posts only `{format: "json"}`. Stack Overflow's UI offers
a format selection, but its mutation ignores the supplied format and its
service also posts only `{format: "json"}`. These paths can label downloads
as CSV without requesting CSV from the API. Treat UI controls, declared types,
and actual service bodies separately when migrating them.

## 6. Screen composition

**Overview:** each source builds selector options from an unscoped dashboard
query and requests filtered cards, graph data, and date bounds separately.
`OverviewShared.ts` builds filter parameters, metric cards, graph intervals,
and Nivo series. Shared `components/overview/` components render the layout.

**Collect:** source-specific forms compose `components/collect/`, with modals
for repositories/projects/tags and source-specific extra controls.
`runCollectWithFeedback` handles submission toasts and navigation to Jobs.
GitHub/Jira require at least one target; Stack Overflow permits no tags but
requires both dates. Form state is local to the source component.

**Preview:** small section wrappers configure a source's shared preview
implementation (labels, section, date field, export table). Preview components
own filters and translate them to source-specific request parameters. Columns
are derived from keys present in the current rows, not a fixed table schema.
`PreviewShared.ts` handles column visibility, three-state sorting, value/date
formatting, export feedback, and browser Blob downloads. Cell modals display
long/nested values. `count` drives server-side pagination.

**Jobs:** fetches the global task list, then reverses and paginates the loaded
`results` in memory. It uses the loaded array length rather than API `count`.
Rows depend on `task_id`, `operation`, `repository`, `created_at`,
`created_at_formatted`, `status`, and optional `error`. Status/action rules live
in `components/format-status-item/`: `STARTED` permits stop; `FAILURE` and
`REVOKED` permit restart. `PENDING`, `SUCCESS`/`COMPLETED`, and `PROGRESS` have
presentation mappings; unknown states fall back to Unknown. Row actions are
locked while a mutation and its follow-up refetch run.

## 7. Extending the current frontend

When adding a source or section within this structure:

1. Add IDs, labels, section defaults, and options in `src/sources/index.ts`.
2. Define actual endpoint contracts and services in `src/data/modules/<source>/`,
   add query/mutation hooks, and expose them through `src/data/index.ts`.
   Add routes to the central endpoint catalogue where needed. Source cache-key
   groups are derived from `sourceIds`; update the key structure if the new
   source needs operations beyond overview/date-range/graph/preview.
3. Implement overview, collect, and preview UI under `src/sources/<source>/`;
   register components in `registry.ts`. Existing route shells need no
   source-specific branching when the new module fits their contracts.
4. Reuse screen helpers and composed UI where their contracts fit. For a new
   shared component, follow the component folder, implementation, story, and
   public `index.ts` pattern. Avoid forcing a source-specific API into a
   generic visual component.
5. Check URL defaults, switching sources/sections, empty/loading/error states,
   filter/page reset, collection submission, job actions, and actual export
   format/scope against the intended API. Update both frontend docs.

For the Go migration, first establish the new contracts below; the legacy
source envelope is not a requirement for the replacement backend.

## 8. Known gaps and validation limits

- Request/response types are handwritten; there is no generated OpenAPI client
  or runtime response validation. Many response fields are optional and preview
  rows are untyped records, so mismatches can appear as empty UI.
- The Jira collection/export and Stack Overflow export discrepancies in section
  5 already exist. API contracts must be checked against service calls, not
  just type declarations or controls.
- `npm run build` uses Vite without `tsc`; TypeScript errors can survive a
  successful bundle. There is no type-check script or declared TypeScript
  compiler dependency in `package.json`.
- ESLint's configured file pattern covers JS/JSX only. It does not lint most
  application code in TS/TSX.
- Vitest uses a Node environment. The existing suite is
  `parseCollectUrl.test.ts`; there are no rendered-page, HTTP-contract, or
  browser end-to-end tests configured. Storybook stories are examples, not
  automated API integration tests.
- Mining completion does not automatically invalidate source data caches.
  Jobs pagination assumes its loaded response contains the list to display.
- Authentication, role-aware UI, credential management, and Go platform
  discovery are absent.

## 9. Compatibility with the Go backend (planned work)

Use the [Go architecture](../backend-go/architecture.md),
[database naming conventions](../backend-go/database.md), and the running API's
`/api/openapi.json` and `/api/docs` as the new contract references. The comparison
below reflects the currently checked-in handlers; it is not a promise of
legacy endpoint parity.

| Area | Current frontend | Go contract / rework needed |
|---|---|---|
| Authentication | No frontend auth flow. | Cookie sessions via `/api/auth/login`, `/logout`, `/me`, and `/password`; introduce session state, login/logout, and unauthenticated handling. Roles are viewer, researcher, admin. |
| Browser origin | Often Vite plus an absolute legacy API URL. | Backend uses `http.CrossOriginProtection` for browser writes and is designed for same-origin sessions. Configure a same-origin dev/production proxy; cross-origin credentials alone do not resolve this. |
| Platform catalogue | Three sources and sections hard-coded. | `/api/platforms` exposes platform capabilities and credential schemas. Decide which UI is dynamic and hide unsupported capabilities. |
| Credentials | No credential-management UI. | Lab-wide pool via `/api/credentials`, with admin write/test/delete actions and secret hints. Add role-aware management if exposed in the UI. |
| Targets | Collect form submits multiple source-specific target strings. | Register repositories using `POST /api/repositories` with `{url}`; list them with `GET /api/repositories`. Repository IDs scope Git/GitHub data. |
| Collection request | `POST /api/{source}/collect/` with legacy envelope. | `POST /api/collections` with `{platform, parameters}` returns a collection (202). GitHub is a Git enricher: Git collections carry `repository_id`/`repository_ids` and/or `url`/`urls` (several repositories per collection, like the legacy `targets`), `commits`, and `enrich.github` resource options. The legacy `start_date`/`end_date` map to `enrich.github.created_since`/`created_until` (RFC 3339, until exclusive), which restrict issues, pull requests and releases to a creation period; `since` separately re-mines only items updated since then. Commits are always mined in full. |
| Progress/actions | Celery task IDs, statuses, stop/restart routes. | Use collection IDs, `GET /api/collections`, `GET /api/collections/{id}`, and `POST /api/collections/{id}/cancel`. Display progress counters and collection states (`running`, `completed`, `partial`, `canceled`). There is no equivalent restart endpoint; define re-collection behaviour explicitly. |
| Preview paths | Global source tables with query-string scope. | `GET /api/{platform}/preview/{dataset}` serves every mined table as a flat dataset (backend-go architecture.md §9.2): git `repositories`, `commits`, `commit-files`, `refs`; GitHub `repositories`, `issues`, `pull-requests`, `issue-comments`, `issue-events`, `pull-request-commits`, `pull-request-reviews`, `pull-request-review-comments`, `commits`, `releases`, `release-assets`, `users`. `GET /api/{platform}/preview` lists them with typed columns and their filter parameters, and `/api/platforms` lists their names, so sections can be built from the catalogue. Scope to a repository with `repository_id=`. Per-item endpoints (`/api/github/repositories/{id}/issues/{number}`, …) remain for nested detail views. |
| Pagination/filters | `{count, results}`, `page`, `page_size`, Django ordering/date lookups. | Previews return `{platform, dataset, count, limit, offset, results}` with `limit` (≤ 1000, default 50) and `offset`; convert pages with `offset = (page - 1) * limit`. `search=` matches the searchable columns, `sort=-col,col2` sorts, `since`/`until` (RFC 3339 or `YYYY-MM-DD`, until exclusive) apply to the dataset's `time_column`, and each column adds filters: `col=` (repeat for several values), `col_min`/`col_max` for numbers, `col_since`/`col_until` for timestamps. Unknown parameters are a 422. Other list endpoints still return bare arrays. |
| Field names/details | Legacy dashboard fields and generic preview rows. | Preserve documented API names: platform timestamps such as `github_created_at`, local `created_at`/`updated_at`, mining `first_mined_at`/`last_mined_at`. Inspect detail endpoints for nested data; don't assume list rows contain it. |
| Overview/catalogue | Dashboard supplies metrics, entities, chart series, date bounds. | `GET /api/{platform}/dashboard` and `/dashboard/graph` exist for `git` and `github` in one shared format (backend-go architecture.md §9.1), but it differs from the legacy one: `entity` instead of `repository_id`, RFC 3339 `since`/`until` (exclusive) instead of `start_date`/`end_date`, `entity`/`entities` instead of `selectedEntity`, `cards` as an ordered list of `{key, label, type, value, windowed}` instead of a number map, `last_mined_at` instead of `time_mined`, and `graphs[]` of series sharing `buckets` instead of one `time_series: {labels, datasets}`. Commits moved from the GitHub dashboard to git's. No date-range endpoint yet. |
| Export | Legacy source export endpoint and Blob download. | `GET /api/{platform}/export/{dataset}?format=csv\|json\|jsonl` takes the preview's filters, `search` and `sort` (no paging) and streams every matching row as an attachment with a `Content-Disposition` filename, so the export is the currently filtered table. Being a same-origin GET with the session cookie, it can be a plain link instead of a Blob download. |
| Jira/Stack Overflow | Existing source screens and legacy miners. | Their Go collection jobs remain TODOs. Existing screens do not imply new-backend availability. |
| Errors | Extract `error`/`message`, otherwise generic fallback. | Adapt huma error responses and distinguish 401, 403, validation (422), conflict (409), and unavailable capabilities (501). |
| Deployment | Root Compose/nginx targets Django `raiseapi`. | Go Compose is separate. Frontend hosting/proxy and auth-cookie settings must be connected deliberately. |

Suggested sequence for the rework:

1. Establish same-origin serving and session/role handling; add reliable TS/TSX
   checks and contract tests for the new data layer.
2. Implement repository catalogue/registration and Git + GitHub collection
   forms using the published capability and parameter contracts.
3. Replace Jobs with collection progress/cancel UI and explicit re-collection
   semantics; update cache keys and completion invalidation.
4. Port previews and exports to the dataset endpoints, building sections,
   columns and filters from `GET /api/{platform}/preview`; keep the per-item
   endpoints for detail views.
5. Add dashboards, credential/admin screens, and other platforms as
   their backend contracts become available. Validate each implemented flow
   against the Go stack and update this document with the resulting design.

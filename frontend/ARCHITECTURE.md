# Raise frontend architecture

This document describes the frontend **as implemented**. It talks to the Go
backend in [`backend-go/`](../backend-go/); section 5 lists the contracts it
uses and section 9 what is still to migrate. For setup, commands, and serving,
see [README.md](README.md).

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

[`src/router.tsx`](src/router.tsx) wraps every route except `/login` in
`RequireAuth` ([`src/auth/RequireAuth.tsx`](src/auth/RequireAuth.tsx)), which
renders [`src/layout.tsx`](src/layout.tsx) (sidebar and router `Outlet`) only
with a session. The root layout owns the viewport; individual screens
constrain and scroll their content within it. Router errors and unmatched
routes use `NotFound`.

The custom theme context initialises from root `light`/`dark` classes or the
browser's colour-scheme preference, then updates the root classes and
`data-theme`. Theme selection is held in memory; it is not persisted to storage.

## 2. Code organisation and boundaries

All paths below are relative to `frontend/`. The `@/` alias resolves to `src/`
in Vite, TypeScript, and Vitest.

| Path | Responsibility |
|---|---|
| `src/pages/` | Route shells; select source UI modules. `JobsPage` (collections), `LoginPage`, `RegisterPage` (admin user registration), `CredentialsPage`, `ChangePasswordPage` and `SourceUnavailable` are source-independent. |
| `src/auth/` | `RequireAuth` (session guard, 401 redirect) and `RequireRole`. |
| `src/sidebar/` | Navigation in two groups: **Platform** (the source selector and the screens it scopes: Overview, Collect, Preview) and **System** (Jobs, Credentials, Users, which don't depend on the source). Also query-string normalisation, current user, password and logout. |
| `src/sources/index.ts` | Source IDs, labels, preview sections, defaults, unavailable sources, and related types/options. |
| `src/sources/registry.ts` | Map source and preview-section IDs to React components. |
| `src/sources/{github,jira,stackoverflow}/` | Source-specific overview, collect, and preview UI. Jira and Stack Overflow are not rendered (section 9). |
| `src/sources/shared/` | Shared screen helpers: selectors, overview models (legacy and Go dashboards), collection feedback/URL parsing, table state. |
| `src/data/api/` | Axios transport (`apiClient.ts`) and the central endpoint catalogue (`endpoints.ts`). |
| `src/data/query/` | Query client, cache keys, invalidation, and error-message extraction. |
| `src/data/modules/{auth,collections,credentials,dashboard,datasets}/` | Go API modules: types, services, and query/mutation hooks. They are keyed by Go platform (`git`, `github`), not frontend source. |
| `src/data/modules/{jira,stackoverflow}/` | Legacy Django modules, kept for when those platforms are ported; nothing renders them. |
| `src/data/modules/shared.ts` | Shared types (legacy and Go dashboards, huma errors) and date helpers. |
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
internals directly.

## 3. Routing and state

[`src/router.tsx`](src/router.tsx) uses `createBrowserRouter`, so hosting must
fall back to `index.html` for client routes.

| Route | Component and selection |
|---|---|
| `/login` | `LoginPage`; public. Redirects to `next` (a same-app path only) once logged in. |
| `/`, `/overview` | `OverviewPage` selects `sourceUiModules[source].overview`. |
| `/collect` | `CollectPage` selects `sourceUiModules[source].collect`. |
| `/preview` | `PreviewPage` selects `sourceSectionPreviewUiModules[source][section]`. |
| `/jobs` | `JobsPage`, independent of selected source. |
| `/credentials` | `CredentialsPage` inside `RequireRole role="researcher"` (the API lists credentials to researchers); add, test and delete controls render for admins only. |
| `/register` | `RegisterPage` inside `RequireRole role="admin"`; the sidebar shows it to admins only. |
| `/password` | `ChangePasswordPage`, for every role; opened from the lock button beside **Log out**. |

For an unavailable source (`unavailableSourceReasons` in `src/sources/index.ts`),
the Overview, Collect and Preview pages render `SourceUnavailable` instead of
the source module, the source selector labels it "(unavailable)", and Preview
lists no sections.

| Source | Preview sections (first is the default) |
|---|---|
| `github` | `issues`, `pull-requests`, `commits`, `users` |
| `jira` | `users`, `issues`, `comments`, `sprints` (not rendered) |
| `stackoverflow` | `questions` (not rendered) |

The URL owns the selected integration (`source`) and preview subsection
(`section`). `source-section-resolver.ts` falls back to GitHub for an invalid
or missing source, and to the selected source's first section for an invalid
or missing section. Sidebar helpers preserve `source`, keep a valid `section`
only on Preview, and remove `section` elsewhere. The sidebar replaces invalid
query strings with normalised ones, retaining other query parameters.

Repository selections, dates, search, page size, sort, hidden columns, modal
contents, and collection forms live in component state. They are not encoded
in the URL or persisted. Server data, including the current user, lives in
TanStack Query. Changing pages or source components can therefore reset local
screen state.

**Session.** `RequireAuth` reads `GET /api/auth/me` (`useMeQuery`): a 401
redirects to `/login?next=<current path>`, another error offers a retry. It
also registers the API client's unauthorized handler, so any later 401 (an
expired session) clears the cache and returns to the login screen. Login and
logout clear the query cache, so one user's data never shows for another.
Roles are compared with `hasRole` (viewer < researcher < admin); the UI hides
or disables actions a role can't perform, and the API enforces them.

## 4. Data access and cache

[`apiClient.ts`](src/data/api/apiClient.ts) creates one Axios instance with
`withCredentials` and JSON content type. Its base URL is `VITE_API_URL`, empty
by default, so requests go to the frontend's own origin: Vite's dev server and
nginx proxy `/api/` to the API. The session cookie and the API's
cross-origin protection both need this single origin. Its response interceptor
returns `res.data`, so services receive the response body. Rejections become
`err.response ?? err`; a 401 from anything but login also calls the handler
registered by `RequireAuth`. `apiUrl(path, params)` builds same-origin URLs
for plain links (exports, API docs).

Each Go module follows this pattern:

- `*Types.ts`: request/response contracts, handwritten from the OpenAPI spec.
- `*Service.ts`: endpoint calls; read calls accept `AbortSignal`.
- `*Queries.ts`: `useQuery`/`useMutation` hooks, keys, conditional
  enablement, and invalidation.
- `src/data/index.ts` exposes the UI-facing API.

The query client retries failed reads once (not 401s from `/auth/me`), keeps
data fresh for 30 seconds, and disables refetch on window focus. Cache keys
for Go data are grouped by platform:

```ts
["auth", "me"]
["dashboard", "github", "cards", params]
["datasets", "git", "preview", "commits", params]
["collections", "list"]
```

Preview hooks use `keepPreviousData` during page/filter changes. Dataset
definitions (`GET /api/{platform}/preview`) are cached for an hour.

`useCollectionsQuery` polls every five seconds while a collection is running.
When a running collection settles, it invalidates the dashboard, dataset and
repository caches, so screens show what was mined. Starting a collection
invalidates collections and repositories (a collection can register them).

`getQueryErrorMessage` reads huma's problem details (`detail`, plus
`errors[].location: message` on validation failures), then legacy nested
`error`/`message` fields, and falls back to a caller-supplied message. Screens
use inline errors and/or shared toast helpers. Login and Register map 401 and
409 to specific messages.

## 5. Go API contract

[`endpoints.ts`](src/data/api/endpoints.ts) is the route catalogue. The
running API's `/api/openapi.json` and `/api/docs` are the reference; the
backend's [README](../backend-go/README.md) and
[architecture](../backend-go/architecture.md) §9 describe them. Field names
are the database column names (`github_created_at`, `first_mined_at`, ...).

| Operation | Method and path | Used by |
|---|---|---|
| Session | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | Login, `RequireAuth`, sidebar |
| Own password | `POST /api/auth/password` `{current_password, new_password}` (204; a wrong current password is a 403) | Change password |
| Users (admin) | `GET /api/users`, `POST /api/users` `{username, password, role}` | Register |
| Platforms | `GET /api/platforms` | Credentials (credential kinds and their fields) |
| Credentials | `GET /api/credentials` (researcher), `POST /api/credentials` `{platform, kind, label, fields}`, `POST /api/credentials/{id}/test`, `DELETE /api/credentials/{id}` (admin) | Credentials |
| Dashboard | `GET /api/{platform}/dashboard?entity=&since=&until=` | Overview cards; repository selector options (`entities`) |
| Graph | `GET /api/{platform}/dashboard/graph?…&interval=` | Overview chart |
| Date range | `GET /api/{platform}/dashboard/date-range?entity=` | Date-picker bounds |
| Datasets | `GET /api/{platform}/preview` | Which filters a section offers |
| Preview | `GET /api/{platform}/preview/{dataset}?limit=&cursor=&…` | Preview tables |
| Export | `GET /api/{platform}/export/{dataset}?format=&…` | Preview export (a plain link) |
| Collections | `GET /api/collections`, `POST /api/collections`, `POST /api/collections/{id}/cancel` | Jobs, Collect |
| Collection log | `GET /api/collections/{id}/errors?limit=1000` | Jobs (View log) |
| Repositories | `GET /api/git/preview/repositories?limit=1000&cursor=` (every page) | Jobs (repository names), Collect (known repositories) |

### Overview

The GitHub overview combines two dashboards scoped to the same repository ID:
`github` (issues, pull requests, contributors, stars, forks, ...) and `git`
(commits). Cards are picked by `key` and shown with the API's `label`;
`buildDashboardCardItems` formats them (`null` shows "-"). The chart combines
git's `activity` commits series with github's `activity` graph:
`buildLineSeriesFromDashboardGraphs` aligns their `buckets` on their union,
with zeros where a platform has no data. The date pickers are bounded by both
platforms' date ranges (`mergeDateRanges`), and the interval is chosen from
the selected or available dates.

The date inputs are inclusive days; `toApiSince`/`toApiUntil` convert them to
the API's window: `since` at midnight UTC of the first day, `until` at
midnight UTC after the last (exclusive).

### Preview and export

Each GitHub section is one dataset:

| Section | Platform and dataset |
|---|---|
| Issues | `github` `issues` (pull requests excluded by the dataset) |
| Pull requests | `github` `pull-requests` |
| Commits | `git` `commits` (every mined commit) |
| Users | `github` `users` |

`GithubPreview` waits for the dataset catalogue and offers the repository
filter only when the dataset has a `repository_id` column, and the date
filter only when it has a time column, so it never sends a parameter the
dataset rejects (a 422). Requests send `limit` and `cursor` (see below),
`search`, `sort` (`col` or `-col`, three-state), `since`/`until`
(`YYYY-MM-DD`, until exclusive) and `repository_id`. Columns the catalogue
marks unsortable (long text, JSON) can't be sorted. The response is
`{count, limit, next_cursor, results}`; columns are derived from the rows.

Paging is by keyset cursor, so pages open in order: `GithubPreview` keeps
the cursors it has seen (`cursors[n]` fetches page `n + 1`) and records each
page's `next_cursor`. The footer still numbers pages from `count`, but
disables those past the last known cursor (`maxReachablePage`), including the
last page until it is reached. Changing a filter, the sort or the page size
drops the cursors and returns to page 1, since a cursor only holds for the
query it was made with.

Export builds the same query (no paging) with `format=json|csv` and opens it
as a link: a same-origin GET with the session cookie, streamed by the API as
an attachment, so it is the currently filtered table. The export dialog says so: it shows
the number of matching rows and lists the filters in words (repository,
dates on the time column, search, sort), and notes that hidden columns are
still exported (`PreviewExportModal`'s optional `rowCount` and
`appliedFilters`).

### Collect

GitHub data is an enrichment of a git repository, so the GitHub collect form
starts a `git` collection, built by `buildGithubCollectionParameters`
(`githubCollectParameters.ts`, unit-tested):

```json
{"platform": "git", "parameters": {
  "urls": ["https://github.com/owner/repo"],
  "commits": true,
  "enrich": {"github": {"resources": ["metadata", "issues"],
                        "created_since": "2024-01-01T00:00:00Z",
                        "created_until": "2025-01-01T00:00:00Z",
                        "since": "2025-06-01T00:00:00Z"}}}}
```

- **What to collect** is grouped by source. "From the git
  repository: Commits" sets `commits: true` (a local clone; no token).
  "File diffs" sets `diffs: true` and `commits: true`, since the API mines
  diffs with the commits; Jobs shows it as "commits with diffs".
  "From GitHub" lists `metadata`, `issues`, `pull_requests`, `commits`
  (authors and PR links), `releases` and `users`. Every option is optional;
  commits and repository details are selected by default. `enrich.github` is
  sent only when a GitHub option is selected, so a commits-only collection
  needs no GitHub token.
- **Dates** appear only when issues, pull requests or releases are selected:
  "Created from/until" map to `created_since`/`created_until` (inclusive days
  converted to the API's window), and "Only refresh items updated since"
  (shown with issues or pull requests) maps to `since`. Dates that don't apply
  to the selection are dropped.
- **Token warning:** with a GitHub option selected and no `active` GitHub
  credential (`GET /api/credentials`), the form warns that GitHub items would
  fail, with a link to Credentials for admins.
- **Repositories** are typed as `owner/repo` or a URL, or picked from the
  github.com repositories Raise already knows (git's `repositories` dataset); all
  are sent as URLs, which the API matches to existing repositories.
- A summary sentence says what the button will do; Collect stays disabled
  until there is a repository and an option. Starting needs the researcher
  role; viewers see a notice and a disabled button.

### Jobs (collections)

Rows are collections, newest first (the list returns a bare array; the page
loads up to 1,000 and paginates in memory). Each shows its repositories
(URLs and `repository_ids`, named from git's `repositories` dataset), what it
mines, its creation time, progress (`jobs_done`/`jobs_expected`, plus failed
jobs) and status. `formatStatusItem` maps `running`, `completed`, `partial`
(settled with failures) and `canceled`. Researchers can cancel a running
collection, or run a settled one again: there is no restart endpoint, so this
starts a new collection with the same platform and parameters, which mines
only what is new.

Every role can open a collection's log (`CollectionLogModal`), in any status.
It lists the failed job attempts grouped by job kind, each marked "Given up"
(`is_final`) or "Retried", with its attempt, time, error message and job
arguments, and polls every five seconds while the collection runs. Rate-limit
snoozes aren't failures and don't appear. Collections that finished before
the log existed show no errors.

## 6. Screen composition

**Login:** a standalone form (no sidebar). There is no self-signup; the page
says to ask an admin.

**Overview:** builds selector options from the unscoped `github` dashboard's
`entities` and requests cards, graphs, and date bounds for both platforms
separately. `OverviewShared.ts` holds the Go adapters and the interval rule;
its legacy adapters remain for the Jira and Stack Overflow modules. Shared
`components/overview/` components render the layout.

**Collect:** source-specific forms compose `components/collect/`, with modals
for repositories and source-specific extra controls.
`runCollectWithFeedback` handles submission toasts and navigation to Jobs.

**Preview:** small section wrappers name a platform and dataset for
`GithubPreview`, which owns filters, paging, sort, export and cell modals.
`PreviewShared.ts` handles column visibility, three-state sorting, and value
formatting. `count` drives server-side pagination.

**Jobs:** see section 5. Row actions are locked while a mutation and its
follow-up refetch run.

**Credentials:** the add form is built from `GET /api/platforms`: platforms
with credential kinds (those not mined yet are marked, and their tokens can
still be stored), a kind selector when there are several, and one input per
field (secret fields are password inputs). The API tests a credential before
answering, so the toast reports whether it works. The table shows public
fields, secret hints (`…1234`), status with the tested identity or failure
reason, the most constrained quota from the last test, and per-row re-test
and delete (with a confirmation; a deleted secret must be entered again).

**Change password:** current password, then the new one twice. The form
checks the 12-character minimum, that the new password differs from the
current one, and that both entries match; a 403 is shown as "the current
password is wrong" (it is not a session error, so the user stays on the
page). The API renews the session token, so the user stays logged in.

**Register:** admin-only form (username, role, password of at least 12
characters with confirmation, the API's minimum) and the user list.

## 7. Extending the current frontend

When adding a source or section within this structure:

1. Add IDs, labels, section defaults, and options in `src/sources/index.ts`.
   Remove the source from `unavailableSourceReasons` once its Go platform
   exists.
2. Use the generic Go modules (`dashboard`, `datasets`, `collections`) with
   the platform's ID; add a module under `src/data/modules/` only for
   platform-specific endpoints, and expose hooks through `src/data/index.ts`.
3. Implement overview, collect, and preview UI under `src/sources/<source>/`;
   register components in `registry.ts`. A new preview section is usually a
   wrapper naming a platform and dataset. Existing route shells need no
   source-specific branching.
4. Reuse screen helpers and composed UI where their contracts fit. For a new
   shared component, follow the component folder, implementation, story, and
   public `index.ts` pattern. Avoid forcing a source-specific API into a
   generic visual component.
5. Check URL defaults, switching sources/sections, empty/loading/error states,
   role limits, filter/page reset, collection submission, job actions, and
   export scope against the running API. Update both frontend docs.

## 8. Known gaps and validation limits

- Request/response types are handwritten; there is no generated OpenAPI client
  or runtime response validation. Preview rows are untyped records.
- `npm run build` uses Vite without `tsc`, and there is no type-check script.
  `npx tsc --noEmit -p tsconfig.json` reports errors in Storybook stories and
  the dormant Jira module that predate the migration.
- ESLint's configured file pattern covers JS/JSX only. It does not lint most
  application code in TS/TSX.
- Vitest uses a Node environment. It covers the collection URL parsers and the
  Go contract helpers (`shared.test.ts`, `OverviewShared.test.ts`); there are
  no rendered-page or browser end-to-end tests. Storybook stories are
  examples, not automated tests.
- Several form fields render their label without an accessible association,
  so screen readers and accessibility-tree tools see unnamed text boxes.
- The Jobs page loads at most the 1,000 newest collections.

## 9. Go backend migration status

Done: same-origin serving (Vite proxy and nginx), session login and logout,
role-aware UI, admin user registration, password change, credential
management, the GitHub
overview, collect and preview screens, exports, and the collections (Jobs)
screen.

Still to do:

| Area | Notes |
|---|---|
| Own account | No screen for managing API keys (`/api/auth/api-keys`), nor for disabling users, changing roles or resetting another user's password (`PATCH /api/users/{id}`). |
| More GitHub data | The API also serves releases, comments, timeline events, reviews, commit files and refs as datasets, and detail endpoints (`/api/github/repositories/{id}/issues/{number}`, ...) for nested views. The UI shows four sections. |
| Platform catalogue | Sources and sections are hard-coded; `GET /api/platforms` could drive them. |
| Jira and Stack Overflow | Their Go collection jobs are TODO (backend-go architecture.md §12). Their screens and data modules still target the Django contract and are hidden; port them to the generic modules when the platforms exist. |

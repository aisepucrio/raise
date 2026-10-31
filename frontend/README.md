# Raise frontend

The React single-page application for Raise, a repository and mining tool for
software-engineering data. It lets users configure collections, monitor jobs,
view summary charts, and preview or export mined data from GitHub, Jira, and
Stack Overflow.

**The current frontend targets the legacy Django/Celery backend in
[`backend/`](../backend/). It is not yet compatible with `backend-go/`; changing
`VITE_API_URL` alone is insufficient.** See
[ARCHITECTURE.md](ARCHITECTURE.md) for the code organisation, current API
contracts, known gaps, and migration checklist.

## Requirements

- Node.js **22.12 or newer** on the Node 22 line, or a newer supported Node
  version. The Docker image uses Node 22; the locked Vite tooling requires
  `^20.19.0 || >=22.12.0` (the previous Node 18 recommendation is obsolete).
- npm and the committed [`package-lock.json`](package-lock.json).
- A running legacy API for data-backed screens. Vite and Storybook can run
  independently, but Vite does not supply mock API responses.

## Local development

From the repository root:

```sh
cd frontend
npm ci
```

Create `frontend/.env.local` with the API origin, for example:

```dotenv
VITE_API_URL=http://localhost:8000
```

Then start Vite:

```sh
npm run dev
```

Open `http://localhost:5173` (or the port Vite reports if that port is occupied).
The script binds to `0.0.0.0`. The legacy backend must allow the browser's
frontend origin for cross-origin requests; there is no Vite API proxy configured.
See the [repository README](../README.md) for legacy stack setup.

### Configuration

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Axios base URL. Use an origin such as `http://localhost:8000`, **without `/api`**: endpoint paths already include `/api/`. If unset, requests use the frontend origin, which requires an API reverse proxy. |
| `IS_DEBUG` | Used only by the container's `run.sh`. The exact string `False` selects the build watcher; any other value selects the Vite dev server. |

Vite embeds `VITE_*` values into the browser bundle at build time. Restart the
dev server after changing an env file; rebuild a production bundle after changing
its API URL. These values are public: backend mining credentials belong on the
backend, never in frontend environment variables.

## Commands and checks

Run these from `frontend/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Vite development server, normally port 5173. |
| `npm run build` | Build static assets into `dist/`. |
| `npm run preview` | Serve the built `dist/` locally, normally port 4173. Run the build first. |
| `npm run start` | Run `vite build --watch`; writes `dist/` as files change. **Does not start an HTTP server.** |
| `npm test` | Run Vitest once in the Node environment. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run lint` | Run the current ESLint configuration. |
| `npm run storybook` | Start the component catalogue on port 6006. |
| `npm run build-storybook` | Build the static catalogue into `storybook-static/`. |

For frontend changes, run `npm test`, `npm run build`, and `npm run lint`.
For shared UI changes, also inspect the relevant Storybook stories.

Checks have limits: `build` runs Vite without a TypeScript type-checking step,
and ESLint currently targets only `.js`/`.jsx`, not `.ts`/`.tsx`. The current
unit suite covers collection URL parsers; it does not test rendered pages,
HTTP contracts, or end-to-end flows. See the architecture document's
[known gaps](ARCHITECTURE.md#8-known-gaps-and-validation-limits).

## Using the application

| Route | Purpose |
|---|---|
| `/` or `/overview?source=github` | Summary cards and time-series charts; filter by repository, project, or tag and dates. |
| `/collect?source=github` | Configure and start mining. Successful submission opens Jobs. |
| `/preview?source=github&section=issues` | Browse server-paginated data, search, sort, hide columns, inspect cells, and request exports. |
| `/jobs` | Global collection-job list, refreshed every five seconds, with stop/restart actions based on status. |

Supported `source` values are `github`, `jira`, and `stackoverflow`. The default
is GitHub. Preview sections and URL normalisation are documented in
[ARCHITECTURE.md](ARCHITECTURE.md#3-routing-and-state).

## Containers and serving the build

The root [`docker-compose.yaml`](../docker-compose.yaml) runs the frontend
together with the [Go backend](../backend-go/README.md). It reads the root
`.env` but passes only `VITE_API_URL` and `IS_DEBUG` to the frontend
container, and publishes port 5173 for development. The frontend still calls
the legacy Django endpoints, so it can't load data from the Go backend until
it is migrated (see [backend-go/architecture.md](../backend-go/architecture.md) §12).
The [frontend Dockerfile](Dockerfile) uses Node 22 Alpine; [`run.sh`](run.sh)
runs `npm install` on startup before selecting dev server or build watcher.

In the Compose production profile, nginx serves the shared `frontend_dist`
volume on port 8080. Set `IS_DEBUG=False` so the frontend writes `dist/` and
start the profile from the repository root:

```sh
docker compose --profile production up --build
```

[`nginx.conf`](../nginx.conf) falls back to `index.html` for client-side routes
and proxies `/api/` to the Go API (`api:8000`). For that same-origin setup, leave
`VITE_API_URL` empty when building. An absolute API URL bypasses that proxy.

For another static host, serve `dist/`, provide an `index.html` fallback for
routes such as `/preview`, and route API requests to the configured backend.
`npm run preview` is a local build check, not the production serving setup.

## Where to read next

- [Frontend architecture and migration notes](ARCHITECTURE.md).
- [Go backend setup and configuration](../backend-go/README.md).
- [Go backend architecture and HTTP conventions](../backend-go/architecture.md).
- [Go database schema and field naming](../backend-go/database.md).

Keep this README in sync with commands, configuration, and serving changes;
update ARCHITECTURE.md when routes, source modules, or API contracts change.

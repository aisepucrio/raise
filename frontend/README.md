# Raise frontend

The React single-page application for Raise, a repository and mining tool for
software-engineering data. It lets users configure collections, monitor jobs,
view summary charts, and preview or export mined data from GitHub, Jira, and
Stack Overflow.

It uses the Go backend in [`backend-go/`](../backend-go/): users log in with
a session cookie, and the GitHub screens read the `git` and `github`
platforms. Jira and Stack Overflow are shown as unavailable until their mining
is ported. See [ARCHITECTURE.md](ARCHITECTURE.md) for the code organisation,
API contracts, known gaps, and remaining migration work.

## Requirements

- Node.js **22.12 or newer** on the Node 22 line, or a newer supported Node
  version. The Docker image uses Node 22; the locked Vite tooling requires
  `^20.19.0 || >=22.12.0` (the previous Node 18 recommendation is obsolete).
- npm and the committed [`package-lock.json`](package-lock.json).
- A running Go API (`api` and `worker`, see the
  [backend README](../backend-go/README.md)) for every screen except Storybook.
  Vite does not supply mock API responses.

## Local development

From the repository root:

```sh
cd frontend
npm ci
```

Start the Go API on `http://localhost:8000` (backend README, Development),
then Vite:

```sh
npm run dev
```

Open `http://localhost:5173` (or the port Vite reports if that port is
occupied) and log in. The script binds to `0.0.0.0`.

The dev server proxies `/api/` and `/healthz` to the API, so the browser
talks to one origin. This is required: the session cookie belongs to that
origin, and the API rejects browser writes from any other origin and sends no
CORS headers, so there is no setting to call the API on another origin. If the
API isn't on `localhost:8000`, set `API_PROXY_TARGET` (for example in
`frontend/.env.local`).

There is no self-signup. The API creates the first admin from
`ADMIN_USERNAME`/`ADMIN_PASSWORD` in the root `.env` (backend README); admins
then register other users on the **Users** screen.

### Configuration

| Variable | Purpose |
|---|---|
| `API_PROXY_TARGET` | Where `npm run dev` proxies `/api/` and `/healthz`. Default `http://localhost:8000`; Compose sets `http://api:8000`. Read by `vite.config.js` only, never bundled. |
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
and ESLint currently targets only `.js`/`.jsx`, not `.ts`/`.tsx`. Run
`npx tsc --noEmit -p tsconfig.json` by hand: it reports errors in Storybook
stories and the line chart's colour prop that predate the Go migration, so
check that no new ones appear. The unit suite covers collection URL parsers and the
Go contract helpers (date windows, dataset query strings, dashboard cards and
series); it does not test rendered pages or end-to-end flows. See the architecture document's
[known gaps](ARCHITECTURE.md#8-known-gaps-and-validation-limits).

## Using the application

| Route | Purpose |
|---|---|
| `/login` | The only public route. Other routes redirect here without a session and return to the requested page after logging in. |
| `/` or `/overview?source=github` | Summary cards and time-series charts; filter by repository and dates. |
| `/collect?source=github` | Configure and start mining (researcher or admin): pick or type repositories, choose what to collect (commits need no token; GitHub data needs one), optionally limit GitHub items by date. Successful submission opens Jobs. |
| `/preview?source=github&section=issues` | Every git and GitHub dataset, grouped in the sidebar under Git and GitHub. Browse server-paginated data, search, sort, hide columns, inspect cells, and export the filtered table as JSON or CSV. |
| `/jobs` | Collections with their progress, polled every five seconds while one runs; view a collection's error log, cancel running ones or run a settled one again. |
| `/credentials` | Researchers see the lab's platform tokens (status, quota left, secret hints); admins add, re-test and delete them. Tokens are tested as they are added. |
| `/entities?source=github` | Admin only. Named after what the platform mines from: **Repositories** on GitHub (Projects on Jira, Tags on Stack Overflow, once they are available). On GitHub: list repositories, see what was collected for each (items per kind of data, shared with forks, last collected), remove one kind of data, or delete a repository with everything collected for it. |
| `/register` | Admin only: register users and list them. |
| `/password` | Any user: change their own password (current password, then the new one twice). Opened from the lock button next to **Log out**. |

Supported `source` values are `github`, `jira`, and `stackoverflow`. The default
is GitHub. Jira and Stack Overflow show an "unavailable" notice. Preview sections and URL normalisation are documented in
[ARCHITECTURE.md](ARCHITECTURE.md#3-routing-and-state).

## Containers and serving the build

The root [`docker-compose.yaml`](../docker-compose.yaml) runs the frontend
together with the [Go backend](../backend-go/README.md). It reads the root
`.env` but passes only `IS_DEBUG` to the frontend container, sets
`API_PROXY_TARGET=http://api:8000`, and publishes port 5173 for development.
The [frontend Dockerfile](Dockerfile) uses Node 22 Alpine; [`run.sh`](run.sh)
runs `npm install` on startup before selecting dev server or build watcher.

In the Compose production profile, nginx serves the shared `frontend_dist`
volume on port 8080. Set `IS_DEBUG=False` so the frontend writes `dist/` and
start the profile from the repository root:

```sh
docker compose --profile production up --build
```

[`nginx.conf`](../nginx.conf) falls back to `index.html` for client-side routes
and proxies `/api/` to the Go API (`api:8000`), so the frontend and the API
share one origin.

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

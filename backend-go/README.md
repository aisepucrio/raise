# Raise backend (Go)

The backend for Raise: a lab-hosted data repository and mining tool for
software-engineering data (git repositories, GitHub, GitLab, Jira, Stack
Overflow). Written in Go, using [River](https://riverqueue.com) for jobs and
[huma](https://huma.rocks) for the HTTP API, with PostgreSQL as the only
datastore.

For how the code is organised and why, see [architecture.md](architecture.md).
For the database schema (every table and column, naming conventions, and the
planned tables for platforms not built yet), see [database.md](database.md).

- [Components](#components)
- [Requirements](#requirements)
- [Quick start (Docker Compose)](#quick-start-docker-compose)
- [Development](#development)
- [Production](#production)
- [Usage](#usage)
- [Configuration reference](#configuration-reference)

---

## Components

| Binary | Purpose |
|---|---|
| `api` | HTTP API on `HTTP_ADDR` (default `:8000`). It only enqueues jobs and never mines. |
| `worker` | Runs mining jobs. Needs `git` on its `PATH` and a writable `GIT_MIRROR_DIR`. |
| `raisectl` | Operations CLI: database migrations, user management, encryption key generation. |

All three read their configuration from environment variables, and all three
share one PostgreSQL database.

## Requirements

| | Development | Production |
|---|---|---|
| Docker + Docker Compose | recommended | recommended |
| Go | 1.27.3+ (security fixes; CI uses the version in go.mod) | only to build without Docker |
| git | 2.31+ (for the worker) | included in the image |
| PostgreSQL | 18 (via `make db`) | 14+ |

---

## Quick start (Docker Compose)

The Compose file and `.env` live at the **repository root**, shared with the
frontend. From the root:

```sh
cp .env.example .env
(cd backend-go && make keygen)  # prints e.g. 1:R9B24XWw…; paste it into ENCRYPTION_KEYS in .env
                                # also set ADMIN_PASSWORD (12+ characters) in .env
docker compose up --build -d    # db, migrations, api on :8000, worker, frontend on :5173
```

On its first start, the API creates the admin `ADMIN_USERNAME` (default
`admin`) with `ADMIN_PASSWORD`. Log in at <http://localhost:5173> and change
the password there. Without those variables, create the admin with
`docker compose run --rm -it migrate raisectl user create -username admin -role admin`.

Then open <http://localhost:8000/api/docs> to browse the interactive API docs,
or follow [Usage](#usage).

If you don't have Go installed, generate the key with Docker instead:
`docker compose run --rm migrate raisectl keygen`.

---

## Development

### Option A: everything in Docker

This is the [Quick start](#quick-start-docker-compose). After code changes,
rebuild from the repository root with `docker compose up --build -d`. Logs:
`docker compose logs -f api worker`.

### Option B: Postgres in Docker, Go on the host (faster iteration)

```sh
cp .env.example .env            # at the repository root; set ENCRYPTION_KEYS (make keygen)
cd backend-go
make db                         # Postgres 18 on localhost:5433, from the root docker-compose.yaml

set -a; source ../.env; set +a  # export .env into the shell; the binaries don't read .env themselves
make migrate                    # River + app migrations
# The first `make api` creates the admin from ADMIN_USERNAME/ADMIN_PASSWORD;
# without them: make user USERNAME=admin ROLE=admin

make api                        # terminal 1: http://localhost:8000
make worker                     # terminal 2 (run `set -a; source ../.env; set +a` there too)
```

With the `.env.example` defaults, mirrors are written to `backend-go/data/mirrors`,
which git ignores.

### Common tasks

| Command | What it does |
|---|---|
| `make test` | Unit tests: one `<package>_test.go` per package, fixtures in `testdata/` (architecture.md §2.1). The git tests need `git`; the GitHub tests use `httptest`. |
| `make lint` | golangci-lint, including the **depguard import rules** from architecture.md §3 |
| `make generate` | Regenerate sqlc code after editing a `query.sql` file or a migration |
| `make build` | Build `api`, `worker` and `raisectl` into `./bin/` |
| `go run ./cmd/raisectl migrate status` | Show which migrations are applied |
| `go run ./cmd/raisectl migrate down` | Roll back the latest app migration |
| `make reset-db` | Development only: drop everything in the compose database (mined data, users, credentials, jobs) and re-apply the migrations. Needs `DATABASE_URL` set to the compose database |

### Database changes

1. Follow the naming conventions in [database.md](database.md#naming-conventions).
   If the table is listed there as planned, implement that design.
2. Edit the owning module's migration in `internal/db/migrations/` (one per
   module: `00004_git.sql`, `00005_github.sql`, …), or add one for a new
   module, numbered after the latest (e.g. `00006_gitlab.sql`). No
   production database exists yet, so migrations are edited in place; once
   one is deployed, add new migrations instead.
3. Put queries in the owning package's `query.sql`. A new package also needs an
   entry in `sqlc.yaml`.
4. Run `make generate`, then `make reset-db` (an edited migration doesn't
   re-run on a database that already applied it).
5. Update database.md: mark the table ✅ implemented (it may be 📝 planned), or edit
   its columns.

Migrations are embedded in the binaries, so a deployed `raisectl` always carries
the migrations that match its code.

### Adding a platform

See architecture.md §4.3. In short:
1. Create `internal/platform/<name>/`, modelled on `platform/github`.
2. Add its tables and queries.
3. Register it in `internal/app/registry.go`.
4. Add its import rules to `.golangci.yml`.

---

## Production

The repository's `docker-compose.yaml` is for development: it publishes the
database port and uses fixed credentials. In production, run the same Docker image with the
changes below.

### 1. Build the image

```sh
docker build -t raise-backend:<version> backend-go/
```

`.dockerignore` is an allowlist: only `go.mod`, `go.sum`, `cmd/` and
`internal/` are sent to Docker, so `.env` and the mirrors never reach the image
or its build cache. If the build ever needs another top-level file or
directory, re-include it there.

The image contains `api`, `worker`, `raisectl` and `git`. It runs as a non-root
user (`raise`, uid 10001). The default command is `api`; for the other binaries,
pass the command explicitly (e.g. `worker`).

### 2. Configure

| Variable | Production value |
|---|---|
| `DATABASE_URL` | A dedicated database user with a strong password, e.g. `postgres://raise:…@db:5432/raise` |
| `ENCRYPTION_KEYS` | Generate with `raisectl keygen` and **store it in your secret store or backups**. Without it, stored credentials can't be decrypted. |
| `SECURE_COOKIES` | `true`, since the app must be served over HTTPS |
| `TRUST_PROXY` | `true` when behind nginx or another reverse proxy |
| `GIT_MIRROR_DIR` | A persistent volume mounted on the worker (default `/data/mirrors` in the image) |

The full list is in the [Configuration reference](#configuration-reference).

### 3. Deploy

Order matters: **migrate first**, then start or restart the services.

```sh
docker run --rm --env-file prod.env raise-backend:<version> raisectl migrate up
# then start/restart:
#   api    – command "api", behind the reverse proxy
#   worker – command "worker", with a persistent volume at /data/mirrors
```

A minimal Compose sketch:

```yaml
services:
  migrate:
    image: raise-backend:<version>
    command: ["raisectl", "migrate", "up"]
    env_file: prod.env
  api:
    image: raise-backend:<version>
    command: ["api"]
    env_file: prod.env
    depends_on: { migrate: { condition: service_completed_successfully } }
    restart: unless-stopped
  worker:
    image: raise-backend:<version>
    command: ["worker"]
    env_file: prod.env
    volumes: [mirrors:/data/mirrors]
    depends_on: { migrate: { condition: service_completed_successfully } }
    restart: unless-stopped
volumes:
  mirrors:
```

Don't publish the database port, and don't expose `api` directly. Put it behind
the reverse proxy.

### 4. Reverse proxy (nginx)

Serve the frontend and the API from **the same origin**. Session cookies and the
CSRF protection rely on it.

```nginx
location /api/ {
    proxy_pass         http://api:8000;
    proxy_set_header   Host $host;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}
location = /healthz { proxy_pass http://api:8000; }
location / {
    root      /app/dist;              # frontend build
    try_files $uri /index.html;
}
```

With `TRUST_PROXY=true`, the API takes the client IP from the **last**
`X-Forwarded-For` entry, the one nginx appends. The API is not safe to expose
directly with that setting on.

### 5. Bootstrap the first admin

Either set `ADMIN_USERNAME` and `ADMIN_PASSWORD` for the first API start (it
creates that admin while the database has no users; remove them from
`prod.env` afterwards, since they're no longer used), or run:

```sh
docker run --rm -it --env-file prod.env raise-backend:<version> raisectl user create -username admin -role admin
```

There is no self-signup. After this, admins register users in the web
interface (**Users**) or through the API (`/api/users`), and every
user can change their own password (**Change password**).

### Operations

- **Health check:** `GET /healthz` returns `204`.
- **Graceful shutdown:** on `SIGTERM`, the API drains requests for up to 15s.
  The worker stops fetching new jobs and waits up to 30s for running jobs,
  then cancels them. Interrupted jobs are retried, which is safe because every
  job is idempotent.
- **Scaling workers:** you can run several worker processes.
  - `worker --queues github,jira,stackoverflow,default` handles only the
    API-bound queues.
  - Run the `git` queue only where the mirror volume is mounted. Use a shared
    volume if more than one host runs it.
- **Rotating the encryption key:** append a new key with a higher version
  (`ENCRYPTION_KEYS=1:<old>,2:<new>`) and restart. New credentials are
  encrypted with version 2; old ones still decrypt with version 1. To retire
  the old key entirely, re-add the old credentials before removing it.
- **Backups:**
  - **Postgres:** holds all mined data, users, sessions, credentials and the
    job queue.
  - **`ENCRYPTION_KEYS`:** keep it separately from the database backups.
  - **Mirrors:** optional, since they can be re-cloned, but large repositories
    take time to clone again.
- **Upgrades:** build the new image, run `raisectl migrate up`, then restart
  `api` and `worker`.

---

## Usage

The full, interactive reference is at `/api/docs`; the OpenAPI spec is at
`/api/openapi.json`. The examples below use `curl` against
`http://localhost:8000`.

### Logging in (browser and frontend)

```sh
curl -c cookies -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"…"}' http://localhost:8000/api/auth/login
curl -b cookies http://localhost:8000/api/auth/me
```

The session is an HTTP-only cookie (`raise_session`). Browser writes are only
accepted from the API's own origin, so the frontend is served from the same
origin as `/api/` (Vite's dev proxy, or nginx in production) and sends its
requests there.

### API keys (scripts and notebooks)

```sh
curl -b cookies -H 'Content-Type: application/json' \
  -d '{"label":"my notebook","expires_in_days":90}' http://localhost:8000/api/auth/api-keys
# → {"key": {...}, "token": "rk_…"}   (the token is shown only once)

curl -H "Authorization: Bearer rk_…" http://localhost:8000/api/collections
```

```python
import requests
s = requests.Session()
s.headers["Authorization"] = "Bearer rk_…"
commits = s.get("http://localhost:8000/api/git/preview/commits",
                params={"repository_id": 1, "limit": 1000}).json()["results"]
```

### Roles

| Role | Can |
|---|---|
| `viewer` | Read and export everything |
| `researcher` | Also register repositories, start or cancel collections, and view credentials |
| `admin` | Also manage users and credentials |

### Adding platform credentials (admin)

```sh
curl -b cookies http://localhost:8000/api/platforms          # credential kinds and fields per platform

curl -b cookies -H 'Content-Type: application/json' -d '{
  "platform": "github", "kind": "personal_access_token", "label": "lab token 1",
  "fields": {"token": "ghp_…"}
}' http://localhost:8000/api/credentials
```

Credentials are tested against the platform as soon as they are added. The
response shows `status` (`active` or `invalid`) and `last_test_result`. To
re-test one later, use `POST /api/credentials/{id}/test`.

Adding several tokens per platform increases throughput: jobs spread their
requests across tokens based on remaining quota.

### Mining repositories

```sh
curl -b cookies -H 'Content-Type: application/json' -d '{
  "platform": "git",
  "parameters": {
    "url": "https://github.com/spf13/cobra",
    "commits": true,
    "enrich": {"github": {"resources": ["metadata", "issues", "pull_requests"]}}
  }
}' http://localhost:8000/api/collections
```

- **Repositories:** `url` or `repository_id` for one, `urls` and
  `repository_ids` for several, in any combination (up to 1,000; duplicates
  are mined once). Unknown URLs are registered. The collection does the same
  for every repository, and its progress covers all of them:

  ```sh
  curl -b cookies -H 'Content-Type: application/json' -d '{
    "platform": "git",
    "parameters": {
      "urls": ["https://github.com/spf13/cobra", "https://github.com/cli/cli"],
      "repository_ids": [3],
      "commits": true,
      "enrich": {"github": {"resources": ["issues", "pull_requests", "releases"],
                            "created_since": "2024-01-01T00:00:00Z",
                            "created_until": "2025-01-01T00:00:00Z"}}
    }
  }' http://localhost:8000/api/collections
  ```
- `commits: true` clones or fetches the repository and mines its history
  locally. No token is needed for public repositories.
- `diffs: true` (with `commits: true`) also mines each changed file's text
  diff into `commit_file_diffs`, for the new commits and for the
  repository's commits mined earlier without diffs. Diffs are large (about
  4 KB per commit for spf13/cobra), so they are opt-in. A file's diff is cut
  at 1 MiB, and a commit's at 32 MiB, marked `is_diff_truncated`. Merges have
  no diffs, like they have no files.
- `enrich` fetches platform data from the forge hosting the repository. It needs
  credentials for that platform. GitHub resources:
  - `metadata`: repository metadata (owner, stars, watchers, languages,
    topics, license, label and release counts, …).
  - `issues`: issues, with their comments and timeline events.
  - `pull_requests`: pull requests, with their comments, timeline events,
    commits, reviews and review comments.
  - `commits`: GitHub's view of the mined commits: author and committer
    logins, signature verification, and the pull requests that introduced
    them. Commits mined by the same collection are enriched as each batch is
    mined. Commits mined earlier, which have no GitHub data yet, are enriched
    too, so `commits` also works without `commits: true`.
  - `releases`: releases (drafts only if a token has push access), with their
    assets and download counts. Every run fetches all of them, which is cheap.
  - `users`: profiles (name, company, location, followers, account type, …)
    of the users, organizations and bots that the other resources mention.
    Accounts in data that the same collection mines are fetched as it is
    stored. Accounts in data mined before are fetched or refreshed too, so
    `users` on its own refreshes a repository's profiles.

  Two kinds of date filter apply to issues, pull requests and releases:

  - **`created_since`** (inclusive) and **`created_until`** (exclusive) mine
    only the items created in that window, for a dataset of a period. GitHub
    lists them in creation order, so mining stops at `created_until` instead
    of listing the rest.
  - **`since`** re-mines only issues and pull requests *updated* since then,
    to refresh a repository cheaply. It doesn't apply to releases, since GitHub
    can't filter them by update time. There is no "updated until": stored
    items are always their latest state.

  They combine: `since` with a creation window refreshes the items of that
  window that changed. Neither applies to commits, metadata or users; commits
  are always mined in full, since incremental mining relies on having the
  whole history.
- Re-running a collection only mines what's new.

To track progress:

```sh
curl -b cookies http://localhost:8000/api/collections/1
# {"status": "running", "progress": {"jobs_expected": 5, "jobs_done": 3, "jobs_failed": 0}, …}
```

`jobs_expected` grows as jobs fan out. When everything settles, the status becomes
`completed`, or `partial` if some jobs failed. Cancel with
`POST /api/collections/{id}/cancel`.

To see what went wrong, list the collection's failed job attempts:

```sh
curl -b cookies http://localhost:8000/api/collections/1/errors
# [{"job_kind": "github.list_issues", "job_args": {"owner": "octocat", …}, "attempt": 1,
#   "is_final": true, "error": "no usable credential for platform github", …}]
```

`is_final` marks jobs that were given up (they count in `jobs_failed`); the
others were retried, so even a `completed` collection can list errors. The log
is kept after the job queue deletes its jobs.

### Managing repositories (admin)

```sh
curl -b cookies http://localhost:8000/api/repositories/1/data
# {"repository": {...}, "parts": [
#   {"platform": "git", "key": "commits", "label": "Commits", "item_count": 1118, "shared_count": 0, "last_mined_at": "…", …},
#   {"platform": "git", "key": "diffs", "label": "File diffs", "item_count": 2618, …},
#   {"platform": "github", "key": "issues", "label": "Issues", "item_count": 1259, …}, …]}

curl -b cookies -X DELETE http://localhost:8000/api/repositories/1/data/github/issues   # returns what remains
curl -b cookies -X DELETE http://localhost:8000/api/repositories/1                      # 204
```

- **Parts** are what can be removed on their own. Git has `commits` (with
  their files, diffs, branches and tags) and `diffs`. GitHub has `metadata`,
  `issues`, `pull_requests`, `commits` (logins, signatures, PR links) and
  `releases`, each with the data nested in it (comments, events, reviews,
  assets). GitHub user profiles aren't tied to one repository and aren't
  listed.
- **Removing git's `commits`** also removes every forge's `commits` part,
  which describes them.
- **Forks share commits.** `shared_count` counts items that other
  repositories also contain. Removing a part, or deleting the repository,
  keeps those for the other repositories.
- **Deleting a repository** removes everything mined for it. Its mirror is
  removed by the worker within 15 minutes (`git.prune_mirrors`).
- Both are refused with **409** while jobs of the repository are queued or
  running. Wait for its collections, or cancel them.
- Reading the parts needs any role; removing needs admin.

### Reading mined data

| Endpoint | Returns |
|---|---|
Lists of mined data (repositories, commits, refs, issues, pull requests,
releases, …) are the [previews](#previews-and-exports) under
`/api/{platform}/preview/{dataset}`. The endpoints below return one item
with its nested data:

| Endpoint | Returns |
|---|---|
| `GET /api/repositories/{id}` | One registered repository and the forges that host it |
| `GET /api/repositories/{id}/data` | What was mined for it, part by part (see [Managing repositories](#managing-repositories-admin)) |
| `GET /api/repositories/{id}/commits/{sha}?diffs=` | One commit with its changed files; with `diffs=true`, each file's diff too, once mined |
| `GET /api/github/repositories/{id}` | GitHub repository metadata, plus `contributor_count` computed from the mined commits (`null` until they are mined) |
| `GET /api/github/repositories/{id}/issues/{number}` | One issue or pull request with its comments and timeline events |
| `GET /api/github/repositories/{id}/pull-requests/{number}` | One pull request with its commits, reviews and review comments |
| `GET /api/github/repositories/{id}/commits/{sha}` | GitHub's view of a commit: logins, signature and the pull requests that introduced it |
| `GET /api/github/repositories/{id}/releases/{github_id}` | One release with its notes (`body`) and assets |
| `GET /api/github/users/{login}` | One account's profile. Case-insensitive; bot logins end in `[bot]` (URL-encoded as `%5Bbot%5D`) |

### Dashboards

Every platform with a dashboard (`has_dashboard` in `GET /api/platforms`;
today `git` and `github`) serves it in the same format:

```sh
curl -b cookies 'http://localhost:8000/api/github/dashboard?entity=1&since=2024-01-01T00:00:00Z'
# {"platform": "github", "entity": {"id": "1", "name": "spf13/cobra"}, "entities": [],
#  "cards": [{"key": "issues", "label": "Issues", "type": "integer", "value": 120, "windowed": true},
#            {"key": "stars", "label": "Stars", "type": "integer", "value": 39000, "windowed": false}, …],
#  "last_mined_at": "2026-10-30T12:00:00Z"}

curl -b cookies 'http://localhost:8000/api/github/dashboard/graph?entity=1&interval=month'
# {"platform": "github", "entity": {…}, "interval": "month",
#  "buckets": ["2013-09-01", "2013-10-01", …],
#  "graphs": [{"key": "activity", "label": "Activity", "cumulative": false,
#              "series": [{"key": "issues_opened", "label": "Issues opened", "values": [3, 7, …]}, …]}, …]}
```

```sh
curl -b cookies 'http://localhost:8000/api/github/dashboard/date-range?entity=1'
# {"platform": "github", "entity": {…}, "first_at": "2013-09-03T17:40:26Z", "last_at": "2026-07-10T21:43:07Z"}
```

- `entity` scopes the dashboard (a repository ID for git and GitHub). Without
  it, the dashboard covers all of the platform's data and `entities` lists
  what it can be scoped to.
- `since` (inclusive) and `until` (exclusive) are RFC 3339 times. Cards with
  `windowed: false`, such as stars, are current snapshots that ignore them.
- Cards are typed (`integer`, `number`, `timestamp`, `text`); `value` is
  `null` when unknown.
- `date-range` returns the earliest and latest values of the timestamp the
  window applies to (`null` without data), to bound date pickers.
- Every series has one value per entry in `buckets` (UTC interval start
  dates; weeks start on Monday). `cumulative` graphs hold running totals,
  including data before `since`. `interval` is `day`, `week`, `month`
  (default) or `year`; a graph longer than 10,000 buckets is rejected.

Which cards and graphs each platform has, and which timestamp the window
applies to, is in architecture.md §9.1.

### Previews and exports

Every mined table is also served as a flat **dataset** that can be previewed a
page at a time and exported in full, with the same filters:

| Endpoint | Returns |
|---|---|
| `GET /api/{platform}/preview` | The platform's datasets, with their typed columns, filter parameters, key and time column |
| `GET /api/{platform}/preview/{dataset}` | A page of rows: `{platform, dataset, count, limit, next_cursor, results}` |
| `GET /api/{platform}/export/{dataset}?format=csv\|json\|jsonl` | Every matching row, streamed as an attachment |

| Platform | Datasets |
|---|---|
| `git` | `repositories`, `commits`, `commit-files`, `commit-diffs`, `refs` |
| `github` | `repositories`, `issues`, `pull-requests`, `issue-comments`, `issue-events`, `pull-request-commits`, `pull-request-reviews`, `pull-request-review-comments`, `commits`, `releases`, `release-assets`, `users` |

```sh
# Open bug issues of repository 1 created in 2024, most commented first
curl -b cookies 'http://localhost:8000/api/github/preview/issues?repository_id=1&state=open&label_names=bug&since=2024-01-01&until=2025-01-01&sort=-comment_count'

# The same rows as CSV
curl -b cookies -OJ 'http://localhost:8000/api/github/export/issues?format=csv&repository_id=1&state=open&label_names=bug&since=2024-01-01&until=2025-01-01'

# Large commits mentioning "fix"
curl -b cookies 'http://localhost:8000/api/git/preview/commits?repository_id=1&search=fix&lines_added_min=100&is_merge=false'
```

Parameters:

- **Paging** (preview only) is by keyset: `limit` (1 to 1,000, default 50)
  and `cursor`. Omit `cursor` for the first page; each page's `next_cursor`
  fetches the next one with the same filters and sort, and is `null` on the
  last page. A cursor made for another sort is a 422. Pages can only be
  walked forward, but each costs the same however deep it is. `count` is
  the number of matching rows across all pages.

  ```sh
  curl -b cookies 'http://localhost:8000/api/git/preview/commits?repository_id=1&limit=1000'
  # {"count": 1118, "limit": 1000, "next_cursor": "eyJzIjoi…", "results": [...], …}
  curl -b cookies 'http://localhost:8000/api/git/preview/commits?repository_id=1&limit=1000&cursor=eyJzIjoi…'
  ```
- **`sort`**: comma-separated columns, `-` for descending
  (`sort=-github_created_at,number`). The default is the time column, newest
  first. The key columns always break ties, so pages are stable.
- **`search`**: case-insensitive substring match on the searchable columns
  (titles, bodies, messages, logins, names, paths).
- **`since` and `until`**: on the dataset's time column (e.g.
  `github_created_at`, `authored_at`), RFC 3339 or `YYYY-MM-DD` (midnight UTC),
  `until` exclusive.
- **Column filters**, named after the column:
  - text, booleans and integers: `state=open`; repeat for any of several
    values (`state=open&state=closed`);
  - numbers: `star_count_min=`, `star_count_max=` (inclusive);
  - timestamps: `github_closed_at_since=`, `github_closed_at_until=`;
  - arrays: `label_names=bug&label_names=ui` keeps rows that have all of them.

  Long text (titles, bodies) is searched rather than filtered, and JSON
  columns can't be filtered. Unknown parameters are rejected with a 422, so a
  misspelt filter never silently returns everything.

Rows are flat: one row per table row, without `raw_payload`. Commits and
their files appear once per repository that contains them, each with its
`repository_id`. `pull-requests` includes the conversation side of each pull
request (title, body, labels, …) from `github_issues`. In CSV, arrays and JSON
values are written as JSON text and timestamps in UTC. Exports aren't paged
and stream for as long as the client reads; use filters to narrow them.

Response fields use the same names as the database columns described in
[database.md](database.md). For example, `github_created_at` is when an issue
was opened on GitHub, while `first_mined_at` is when Raise first fetched it.
For analyses that the API doesn't cover, query PostgreSQL directly with the
same names. The exceptions are values computed when requested: the datasets'
`is_merge` (git commits with two or more parents), `kind` (git refs: `branch`
or `tag`) and `pull_request_numbers` (GitHub commits, from
`github_commit_pull_requests`), and `contributor_count`: the distinct authors of the mined
commits, by GitHub login, or by email for authors without one. It covers every
mined branch, while GitHub counts only the default branch. Enrich `commits`
for accurate counts, since without logins an author with several emails counts
more than once.

### What works today

- **Git:** commit mining, and file diffs on request.
- **GitHub** (GraphQL API): repository metadata, issues and pull requests
  with comments, timeline events, PR commits, reviews and review comments, and
  commit enrichment (logins, signatures, introducing pull requests),
  releases with their assets, and the profiles of the accounts involved.
- **Dashboards:** cards and time-series graphs for git and GitHub, in a
  format shared by all platforms.
- **Previews and exports:** every git and GitHub table, with filters, search
  and sorting, as JSON pages or CSV, JSON and JSON Lines downloads.
- **All platforms:** credential testing.

Jira, Stack Overflow and GitLab mining are still to be built; starting those
collections returns `501 Not Implemented`. The roadmap is in architecture.md
§12.

---

## Configuration reference

| Variable | Default | Used by | Description |
|---|---|---|---|
| `DATABASE_URL` | (required) | all | PostgreSQL connection string |
| `ENCRYPTION_KEYS` | (required) | api, worker | Credential encryption keyring: `<version>:<base64>`, comma-separated |
| `LOG_LEVEL` | `info` | api, worker | `debug`, `info`, `warn` or `error` (JSON logs to stdout) |
| `HTTP_ADDR` | `:8000` | api | Listen address |
| `SECURE_COOKIES` | `false` | api | Mark session cookies `Secure` (required over HTTPS) |
| `TRUST_PROXY` | `false` | api | Take the client IP from `X-Forwarded-For` (only behind a proxy) |
| `GIT_MIRROR_DIR` | `./data/mirrors` (`/data/mirrors` in the image) | worker | Where bare mirrors are stored |
| `GIT_BINARY` | `git` | worker | Path to the git executable |
| `GIT_COMMIT_BATCH_SIZE` | `500` | worker | Commits per mining job |
| `GIT_CONCURRENCY` | number of CPUs | worker | Parallel git jobs per worker process |
| `GITHUB_API_URL` | `https://api.github.com` | api, worker | GitHub REST base URL, used for credential tests (GitHub Enterprise: `https://host/api/v3`) |
| `GITHUB_GRAPHQL_URL` | derived from `GITHUB_API_URL` | api, worker | GitHub GraphQL endpoint, used for mining (`https://api.github.com/graphql`; GitHub Enterprise: `https://host/api/graphql`) |
| `GITHUB_HOSTS` | `github.com` | api, worker | Hosts treated as GitHub when registering repositories |
| `GITHUB_CONCURRENCY` | `20` | worker | Parallel GitHub jobs per worker process. GitHub limits GraphQL CPU time per account (architecture.md §5.3), so with a single token, values above about 10 mostly cause snoozes. |
| `GITLAB_HOSTS` | `gitlab.com` | api, worker | Hosts treated as GitLab when registering repositories |
| `ADMIN_USERNAME` | (empty) | api | First admin, created on startup only while the database has no users. Set together with `ADMIN_PASSWORD` or not at all |
| `ADMIN_PASSWORD` | (empty) | api | That admin's password, at least 12 characters. Ignored once any user exists; change it in the web interface |

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
| Go | 1.27.1+ | only to build without Docker |
| git | 2.31+ (for the worker) | included in the image |
| PostgreSQL | 18 (via `make db`) | 14+ |

---

## Quick start (Docker Compose)

```sh
cd backend-go
cp .env.example .env
make keygen                     # prints e.g. 1:R9B24XWw…; paste it into ENCRYPTION_KEYS in .env
docker compose up --build -d    # db, migrations, api on :8000, worker
docker compose run --rm -it migrate raisectl user create -username admin -role admin
```

Then open <http://localhost:8000/api/docs> to browse the interactive API docs,
or follow [Usage](#usage).

If you don't have Go installed, generate the key with Docker instead:
`docker compose run --rm migrate raisectl keygen`.

---

## Development

### Option A: everything in Docker

This is the [Quick start](#quick-start-docker-compose). After code changes,
rebuild with `docker compose up --build -d`. Logs:
`docker compose logs -f api worker`.

### Option B: Postgres in Docker, Go on the host (faster iteration)

```sh
cd backend-go
cp .env.example .env            # set ENCRYPTION_KEYS (make keygen)
make db                         # Postgres 18 on localhost:5433

set -a; source .env; set +a     # export .env into the shell; the binaries don't read .env themselves
make migrate                    # River + app migrations
make user USERNAME=admin ROLE=admin

make api                        # terminal 1: http://localhost:8000
make worker                     # terminal 2 (run `set -a; source .env; set +a` there too)
```

With the `.env.example` defaults, mirrors are written to `./data/mirrors`, which
git ignores.

### Common tasks

| Command | What it does |
|---|---|
| `make test` | Unit tests. The git parser test needs `git`; the GitHub client tests use `httptest`. |
| `make lint` | golangci-lint, including the **depguard import rules** from architecture.md §3 |
| `make generate` | Regenerate sqlc code after editing a `query.sql` file or a migration |
| `make build` | Build `api`, `worker` and `raisectl` into `./bin/` |
| `go run ./cmd/raisectl migrate status` | Show which migrations are applied |
| `go run ./cmd/raisectl migrate down` | Roll back the latest app migration |

### Database changes

1. Follow the naming conventions in [database.md](database.md#naming-conventions).
   If the table is listed there as planned, implement that design.
2. Add a migration to `internal/db/migrations/`, numbered after the latest
   (e.g. `00006_github_pull_requests.sql`), with `-- +goose Up` and
   `-- +goose Down` sections.
3. Put queries in the owning package's `query.sql`. A new package also needs an
   entry in `sqlc.yaml`.
4. Run `make generate`, then `make migrate`.
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

The provided `compose.yaml` is for development: it publishes the database port
and uses fixed credentials. In production, run the same Docker image with the
changes below.

### 1. Build the image

```sh
docker build -t raise-backend:<version> backend-go/
```

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

```sh
docker run --rm -it --env-file prod.env raise-backend:<version> raisectl user create -username admin -role admin
```

There is no self-signup. After this, admins manage users through the API
(`/api/users`).

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

The session is an HTTP-only cookie (`raise_session`). The frontend must send
requests with `credentials: "include"`.

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
commits = s.get("http://localhost:8000/api/repositories/1/commits", params={"limit": 1000}).json()
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

### Mining a repository

```sh
curl -b cookies -H 'Content-Type: application/json' -d '{
  "platform": "git",
  "parameters": {
    "url": "https://github.com/spf13/cobra",
    "commits": true,
    "enrich": {"github": {"resources": ["issues"]}}
  }
}' http://localhost:8000/api/collections
```

- `commits: true` clones or fetches the repository and mines its history
  locally. No token is needed for public repositories.
- `enrich` fetches platform data from the forge hosting the repository. It needs
  credentials for that platform.
- Re-running a collection only mines what's new.

To track progress:

```sh
curl -b cookies http://localhost:8000/api/collections/1
# {"status": "running", "progress": {"jobs_expected": 5, "jobs_done": 3, "jobs_failed": 0}, …}
```

`jobs_expected` grows as jobs fan out. When everything settles, the status becomes
`completed`, or `partial` if some jobs failed. Cancel with
`POST /api/collections/{id}/cancel`.

### Reading mined data

| Endpoint | Returns |
|---|---|
| `GET /api/repositories` | Registered repositories and the forges that host them |
| `GET /api/repositories/{id}/commits?limit=&offset=` | Commits, newest first |
| `GET /api/repositories/{id}/commits/{sha}` | One commit with its changed files |
| `GET /api/github/repositories/{id}/issues?state=&kind=` | GitHub issues and pull requests |

Response fields use the same names as the database columns described in
[database.md](database.md). For example, `github_created_at` is when an issue
was opened on GitHub, while `first_mined_at` is when Raise first fetched it.
For analyses that the API doesn't cover, query PostgreSQL directly with the
same names.

### What works today

- **Git:** commit mining.
- **GitHub:** issues and pull requests (from the issues endpoint).
- **All platforms:** credential testing.

Pull request details, Jira, Stack Overflow and GitLab mining are still to be
built; starting those collections returns `501 Not Implemented`. The roadmap is
in architecture.md §12.

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
| `GITHUB_API_URL` | `https://api.github.com` | api, worker | GitHub API base URL (GitHub Enterprise: `https://host/api/v3`) |
| `GITHUB_HOSTS` | `github.com` | api, worker | Hosts treated as GitHub when registering repositories |
| `GITHUB_CONCURRENCY` | `20` | worker | Parallel GitHub jobs per worker process |
| `GITLAB_HOSTS` | `gitlab.com` | api, worker | Hosts treated as GitLab when registering repositories |

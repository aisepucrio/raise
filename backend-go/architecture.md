# Raise backend (Go): architecture

This is the rewrite of the Django/Celery backend. The database schema and its
naming conventions are described separately in [database.md](database.md). Raise is a data repository and
mining tool, deployed once per research lab. It mines large amounts of data from
software-engineering platforms (git repositories, GitHub, GitLab, Jira, Stack
Overflow) and stores it for analysis.

Design goals:

1. **Throughput through parallelism.** Mining is split into many small,
   independent jobs that run concurrently across workers and credentials.
2. **Idempotency.** Any job can run twice, crash halfway or be retried without
   corrupting data or duplicating rows.
3. **Platforms as vertical slices.** Each platform's client, credential test,
   jobs, storage and routes live together. Adding a platform doesn't touch the
   rest of the code.
4. **A thin API.** HTTP handlers validate input and enqueue jobs. Mining never
   happens in the request path.

---

## 1. Runtime overview

```
            ┌───────────┐  insert-only River client
 browser ──►│  cmd/api  │──────────────┐
 scripts ──►│  (huma)   │              ▼
            └───────────┘        ┌───────────┐       ┌──────────────────────┐
                                 │ Postgres  │◄─────►│ cmd/worker (River)   │
            ┌────────────┐       │ app data  │       │ queues: git, github, │
            │cmd/raisectl│──────►│ + River   │       │ jira, stackoverflow, │
            └────────────┘       │ job queue │       │ default              │
          migrate / users / keys └───────────┘       └──────────┬───────────┘
                                                                │ git CLI
                                                     ┌──────────▼───────────┐
                                                     │ bare mirrors on disk │
                                                     │ (GIT_MIRROR_DIR)     │
                                                     └──────────────────────┘
```

| Binary | Role |
|---|---|
| `cmd/api` | HTTP API. Its River client only *inserts* jobs and never works them. |
| `cmd/worker` | Works jobs. `--queues git,github` limits a process to a subset of queues, so git mining can run on the host that has the mirror volume. |
| `cmd/raisectl` | Operations CLI: `migrate up\|down\|status`, `user create\|reset-password`, `keygen`. |

**Postgres is the only infrastructure dependency.** River stores jobs in the
same database as the application data. The main benefit is **transactional
enqueue**: a job's data and the jobs it fans out to are committed in the same
transaction.

---

## 2. Code layout

```
backend-go/
├── cmd/{api,worker,raisectl}/   entry points: flags, signals, call into app
├── internal/
│   ├── app/                     composition root: config, wiring, no domain logic
│   │   ├── config.go            env configuration
│   │   ├── registry.go          builds all platforms (forges → git → sources)
│   │   ├── api.go               HTTP server wiring
│   │   └── worker.go            River workers, queues, middleware, periodic jobs
│   │
│   ├── access/                  roles, Principal, per-operation role metadata (leaf)
│   ├── apperr/                  sentinel errors: NotFound, Invalid, Conflict, … (leaf)
│   ├── httpapi/                 chi + huma setup, shared middleware, error mapping (leaf)
│   ├── jobkit/                  job conventions: Enqueuer, error mapping, progress, uniqueness (leaf)
│   ├── db/                      pgx pool, embedded goose migrations, River migrations
│   │   └── migrations/          single ordered set of SQL migrations (also the sqlc schema)
│   │
│   ├── auth/                    users, sessions (scs), API keys, role enforcement
│   ├── credential/              encrypted credential store, testing, leasing pool
│   ├── collection/              user-facing mining requests + progress + reconciler
│   │
│   └── platform/
│       ├── platform.go          contracts: Platform, Credentialed, Source, Lease(r), Deps
│       ├── registry.go
│       ├── git/                 base platform: repositories + local commit mining
│       ├── github/              forge: implements git.Enricher (reference implementation)
│       ├── gitlab/              forge: credential test + remote matching (jobs TODO)
│       ├── jira/                source: credential test (jobs TODO)
│       └── stackoverflow/       source: credential test (jobs TODO)
├── sqlc.yaml                    one entry per package: <pkg>/query.sql → <pkg>/sqlc/
├── .golangci.yml                depguard rules enforcing §3
├── Dockerfile, compose.yaml, Makefile, .env.example
```

Every package that owns tables has a `query.sql` and a generated `sqlc/`
subpackage. Persistence is therefore owned by the package that owns the
concept, not by a central data layer. Migrations stay central because goose
needs a single linear history.

---

## 3. Dependency rules

```
cmd ──► app ──► auth, credential, collection, platform/*
                         │            │            │
                         ▼            ▼            ▼
                  platform (contracts)   access, apperr, httpapi, jobkit, db   (leaves)

platform/github ─┐
platform/gitlab ─┴──► platform/git          (forges build on git; never the reverse)
platform/jira, platform/stackoverflow       (standalone; import no other platform)
```

`.golangci.yml` (depguard) enforces these rules; run them with `make lint`.

- The leaves (`access`, `apperr`, `httpapi`, `jobkit`, `db`) import no domain
  package.
- `platform` (the contracts) imports no concrete platform.
- `platform/*` must not import `auth`, `credential`, `collection` or `app`. Platforms:
  - get credentials through the `platform.Leaser` interface;
  - get an enqueuer through `jobkit.Enqueuer`;
  - declare access rules through `access`.
- `platform/git` imports no other platform. It receives forges as `git.Enricher`
  values at wiring time. The interface is defined in `git`, the package that
  consumes it.
- Forges may import `platform/git` but not each other. Standalone sources import
  no other platform.
- Only `cmd/` imports `app`.

---

## 4. Platforms

### 4.1 Contracts

```go
type Platform interface {                // every platform
    ID() ID
    RegisterWorkers(*river.Workers)
    Queues() map[string]river.QueueConfig
    RegisterRoutes(huma.API)
}
type Credentialed interface {            // uses pooled API credentials
    Platform
    CredentialKinds() []CredentialKind   // drives the "add credential" form
    TestCredential(ctx, Credential) (TestResult, error)
}
type Source interface {                  // can start a collection itself
    Platform
    StartCollection(ctx, pgx.Tx, jobkit.Enqueuer, params json.RawMessage) error
}
// platform/git
type Enricher interface {                // forges
    Platform
    MatchRemote(host, path string) (RepoRef, bool)
    CloneAuth(ctx, RepoRef) (*CloneAuth, error)
    StartEnrichment(ctx, pgx.Tx, jobkit.Enqueuer, Repository, RepoRef, EnrichRequest) error
    OnCommitsMined(Repository, RepoRef, shas []string) []river.InsertManyParams
}
```

Capabilities are optional interfaces, checked with type assertions:

| Platform | Platform | Credentialed | Source | git.Enricher |
|---|:-:|:-:|:-:|:-:|
| git | ✓ | | ✓ | |
| github | ✓ | ✓ | | ✓ |
| gitlab | ✓ | ✓ | | ✓ |
| jira | ✓ | ✓ | ✓ | |
| stackoverflow | ✓ | ✓ | ✓ | |

### 4.2 Package shape

Each platform package follows the same file layout. `platform/github` is the
reference implementation:

| File | Contents |
|---|---|
| `platform.go` | `ID`, `Config`, `New(deps, cfg)`, queues, worker registration |
| `client.go` | typed API client: leases a credential per request, reports quota, maps HTTP errors |
| `queries.go` | (GraphQL platforms) query documents and page sizes |
| `credential.go` | `CredentialKinds` and `TestCredential` |
| `enricher.go` | (forges) the `git.Enricher` implementation |
| `jobs.go` | `JobArgs` types: `Kind()`, `InsertOpts()` (queue, uniqueness) |
| `workers.go` | `river.Worker` implementations |
| `store.go` | mapping API payloads to upserts |
| `handlers.go` | lookup, dashboard and export operations |
| `query.sql`, `sqlc/` | the platform's queries and generated code |

### 4.3 Adding a platform

1. Create `internal/platform/<name>/` with the files above, implementing
   `Credentialed` and either `Source` or `git.Enricher`.
2. Add a migration for its tables, and an entry in `sqlc.yaml`. Then run
   `make generate`.
3. Construct it in `app/registry.go`.
4. Add its import rules to `.golangci.yml`.

---

## 5. Git and repositories

The **repository** is the central concept for git-based data. Commit history is
mined **locally** from a bare mirror; pydriller was dropped. Forges attached to
the repository then **enrich** it with platform data.

### 5.1 Data model

Summary only; column-level detail is in [database.md](database.md).

| Table | Owner | Notes |
|---|---|---|
| `repositories` | git | canonical `https://host/path` URL (normalised from https/ssh/scp forms) |
| `repository_remotes` | git | forges hosting the repo, filled by `MatchRemote` at registration |
| `commits` | git | keyed by **SHA only**: content-addressed and shared between forks |
| `repository_commits` | git | which repositories contain which commits |
| `commit_files` | git | per-file `change_type` (added, renamed, …), previous path, similarity, lines added/deleted (NULL = binary) |
| `repository_refs` | git | branch and tag tips seen at the last plan |
| `github_*`, `gitlab_*` | forge | keyed by `repository_id` (+ `sha` for commit enrichment) |

Forges **never write to git's tables.** Analyses join the core tables with the
forge tables.

### 5.2 Mining pipeline

```
POST /api/collections {platform:"git", parameters:{url|repository_id, commits:true,
                                                   enrich:{github:{resources:["issues"]}}}}
 ├─ git.sync_mirror{repo}               unique while in flight; clone or fetch under an advisory lock
 │   └─ git.plan_commits{repo}          rev-list --branches --tags, minus commits already in repository_commits
 │       └─ git.mine_commit_batch{repo, shas[≤500]} × N    (parallel)
 │            ├─ upsert commits, commit_files, repository_commits   (ON CONFLICT DO NOTHING)
 │            └─ forge.OnCommitsMined(...) → enqueued in the same transaction
 └─ github.list_issues{repo, cursor}    runs in parallel with git; no dependency on it
     ├─ github.fetch_issues{repo, node_ids[≤25]} × N        (parallel)
     │   └─ github.fetch_connection{node_id, cursor}        only for overflowing comments/timelines
     └─ github.list_issues{repo, next cursor}               chained until the last page
```

GitHub's side of the pipeline is described in §5.3.

Implementation details:

- **Mining uses the git CLI, not go-git**, because go-git is much slower on
  large histories. Each batch runs a single
  `git log --no-walk=unsorted --stdin -z --raw --numstat --find-renames --diff-merges=off`
  call with a custom format. Its output is streamed into `ParseLog`
  (`logparse.go`), which is tested against a real repository with renames,
  binaries and merges.
- **Mirrors** fetch only `refs/heads/*` and `refs/tags/*`, never GitHub's
  `refs/pull/*`. A new mirror is built in a temporary directory and renamed
  into place. Credentials go through `GIT_CONFIG_*` environment variables, so
  they never appear in process arguments or in the mirror's config.
- **Planning is incremental.** Only commits missing from `repository_commits`
  are planned, so re-running a collection only mines new history.
- **Commit-level enrichment is chained, not orchestrated.** `OnCommitsMined`
  returns follow-up jobs that are inserted in the same transaction that stores
  the batch. This gives dependent work without a workflow engine.
- **Locality.** Mirrors live on the worker's disk (`GIT_MIRROR_DIR`). For now,
  run the `git` queue on one host or on a shared volume. Scaling git across
  hosts later means per-host queues (e.g. `git@node-1`) plus a
  `repository → host` assignment; the jobs themselves don't change.

### 5.3 GitHub (GraphQL)

One GraphQL query returns an issue or pull request together with its labels,
assignees, comments, timeline events, commits, reviews and review threads. The
REST API needs a request per resource per item, so GraphQL reduces the
request count by one to two orders of magnitude. For example, all of
spf13/cobra (1,259 issues, 1,227 pull requests and their nested data) costs
about 700 points of the 5,000-point hourly quota.

| Resource | Jobs | Writes |
|---|---|---|
| `metadata` | `fetch_repository` (1 query) | `github_repositories` |
| `issues` | `list_issues` → `fetch_issues` (25 per query) | `github_issues`, `github_issue_comments`, `github_issue_events` |
| `pull_requests` | `list_pull_requests` → `fetch_pull_requests` (10 per query) | the above, plus `github_pull_requests`, `github_pull_request_commits`, `github_pull_request_reviews`, `github_pull_request_review_comments` |

- **List, then fetch in parallel.** GraphQL pages with opaque cursors, so pages
  can't be fanned out up front. A `list_*` job fetches one page of 100 node
  IDs, which is cheap. In the same transaction it enqueues `fetch_*` jobs for
  those IDs (loaded with `nodes(ids:)`) and the `list_*` job for the next
  cursor. Listing is sequential, but the expensive fetches run in parallel.
- **Stable cursors.** Full runs list in creation order, so new items don't
  shift the pages. With `since`, issues are filtered by GitHub
  (`filterBy: {since}`). Pull requests have no such filter, so they are listed
  by `UPDATED_AT DESC` and listing stops at the first one older than `since`.
- **Nested overflow.** Each fetch includes the first page of every nested
  connection. If a connection has more pages, `batch` enqueues a
  `fetch_connection{connection, node_id, cursor}` job, which chains itself
  until the connection is exhausted. Review threads nest two levels deep
  (threads → comments), so they use smaller first pages (30 × 20).
- **Timeouts split batches.** GitHub aborts queries after 10 seconds (HTTP
  502). When a batch times out, the worker replaces it with two half-size jobs
  instead of retrying the same query.
- **Errors.** GraphQL returns errors in a 200 response, so the client
  classifies them:

  | Error | Handling |
  |---|---|
  | `NOT_FOUND` on a path (a deleted node in a batch, a missing repository) | tolerated: the field is `null` and the worker decides what that means |
  | `RATE_LIMITED` with no points left | rotate to the next credential |
  | `RATE_LIMITED` otherwise, or a 403/429 secondary limit | snooze |
  | `FORBIDDEN` | `ErrPermanent` |
  | anything else | retried |
- **IDs.** The `Int` `databaseId` field overflows for recent issues, comments
  and reviews, so `fullDatabaseId` (a `BigInt` sent as a string) is used
  everywhere.
- **Secondary limits.** GitHub also caps GraphQL CPU time, at roughly 60
  seconds of query execution per minute per user. A heavy pull request batch
  takes about 3 seconds, so `GITHUB_CONCURRENCY=20` on a single token runs into
  this limit. The jobs then snooze for a minute and continue. Throughput scales
  with the number of tokens from different accounts in the pool.

---

## 6. Jobs

### 6.1 Conventions

1. **Args fully describe the work**: `{repo, shas}` or `{repo, page}`, never
   "the work done so far".
2. **All writes are upserts on natural keys.** Re-running a job converges to the
   same state. Commits are immutable, so they use `DO NOTHING`. Issues use
   `DO UPDATE ... WHERE updated_at <= EXCLUDED.updated_at`.
3. **Use `jobkit.UniqueInFlight()`.** It deduplicates identical jobs while they
   are queued or running, but allows them again after completion. River's
   default would block re-runs until completed jobs are cleaned up.
4. **Fan out with `jobkit.Enqueuer`** in the same transaction as the data:
   - `jobkit.FromJob(ctx, job.JobRow)` inside workers;
   - `jobkit.NewEnqueuer(client, collectionID)` when starting a collection.
5. **Each job makes one external request**, or a small bounded number. A
   page-based platform first fetches page 1 to learn the page count, then fans
   out all remaining pages at once. A cursor-based platform (GitHub GraphQL)
   lists cheap ID pages sequentially, chaining one job per cursor, and fans
   out the expensive detail fetches in parallel (§5.3).
6. **Never sleep in a job.** Return `*jobkit.RateLimitedError` and the job is
   snoozed until the quota resets, which frees the worker slot.
7. **One queue per platform**, sized by its own concurrency setting. Git is
   limited by CPU and disk; API platforms are limited by quota.

### 6.2 Error mapping

`jobkit.Middleware` runs around every job:

| Worker returns | Outcome |
|---|---|
| `nil` | completed; collection `done += 1` |
| `*jobkit.RateLimitedError` | `JobSnooze` until reset (+ jitter, capped at 2h); not counted as an attempt |
| `jobkit.ErrNoCredential`, `jobkit.ErrPermanent` (404 and similar) | `JobCancel`; collection `failed += 1` |
| any other error | retried with River's backoff; `failed += 1` only after the last attempt |

### 6.3 Collections and progress

A **collection** is the user-facing request ("mine X"). Its jobs carry
`collection_id` in River metadata, which `Enqueuer` copies to every child job.
Progress is tracked in `collection_progress`:

- `jobs_expected` grows as jobs fan out. Jobs skipped as unique duplicates are
  not counted.
- `jobs_done` and `jobs_failed` grow as jobs settle.
- The counters are **sharded (16 rows per collection)** so that hundreds of
  concurrent jobs don't contend on a single row.

The periodic `collection.reconcile` job (every 15s) marks a running collection
as `completed` or `partial` once `jobs_done + jobs_failed >= jobs_expected`. It runs
periodically because two jobs that finish at the same moment can't each reliably
detect that they were the last one.

`POST /api/collections/{id}/cancel` marks the collection `canceled` and cancels
its pending jobs (looked up by metadata). Running jobs finish their current
unit of work.

---

## 7. Credentials (token management)

Credentials are a **lab-wide pool** managed by admins: they are not per-user.

- **Kinds and fields come from the platform** (`CredentialKinds`). For example,
  Jira needs `base_url` + `email` (public) and `token` (secret).
  `GET /api/platforms` exposes the kinds, so the frontend can render the form
  generically.
- **Storage.** Public fields are stored as JSONB. Secret fields are encrypted
  with AES-256-GCM, with additional authenticated data `platform/kind`, so a
  secret can't be swapped between rows.
  - `ENCRYPTION_KEYS="1:<b64>,2:<b64>"` is a keyring: the highest version
    encrypts, and older versions still decrypt, which allows key rotation.
  - The API only returns secret *hints* (`…abcd`).
- **Testing.** Every credential is tested when it is added, and again on
  `POST /api/credentials/{id}/test`, using the platform's `TestCredential`.
  The result (identity, quotas, failure reason) and the `active`/`invalid`
  status are stored.

  | Platform | Test procedure |
  |---|---|
  | github | `/user` + `/rate_limit` |
  | gitlab | `/api/v4/user` |
  | jira | `/rest/api/3/myself` |
  | stackoverflow | `/info` (also reports the daily quota) |
- **Leasing.** `credential.Pool` implements `platform.Leaser`.
  - `Lease(platform, scope)` picks the active credential with the most
    remaining quota in that scope (e.g. GitHub's `graphql` and `core`), breaking
    ties randomly. Selection takes no row locks, so many workers can lease
    concurrently.
  - The quota count (`credential_quotas.requests_remaining`) is decremented
    optimistically, then overwritten with the real value the API reports
    (`lease.Report`).
  - On a 401 the client calls `lease.Invalidate`, which takes the credential
    out of rotation, and retries with the next one (up to 3).
  - When every credential is exhausted, `Lease` returns a `RateLimitedError`
    carrying the earliest reset time, and the job snoozes until then. When
    there are no credentials at all, it returns `ErrNoCredential`, and the job
    is cancelled.

---

## 8. Authentication and authorization

Accounts are local only: there's no SSO or MFA, which suits a lab-hosted
instance.

- **Passwords** are hashed with argon2id (`alexedwards/argon2id`) and must be at
  least 12 characters. Unknown usernames are compared against a dummy hash, so
  their timing matches a wrong password.
- **Sessions** use `alexedwards/scs`, stored in the Postgres `sessions` table.
  - The `raise_session` cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` when
    `SECURE_COOKIES=true`.
  - The session token is renewed on login and on password change.
  - The user is re-read on every request, so disabling an account or changing a
    role takes effect immediately.
- **API keys** are for scripts and notebooks: `Authorization: Bearer rk_…`.
  - Each key is 256 bits of randomness, stored as a SHA-256 hash and shown only
    once.
  - Keys can be revoked and can expire.
  - A key and a session both resolve to the same `access.Principal`.
- **CSRF** is handled by Go's `http.CrossOriginProtection`, which rejects
  cross-origin, state-changing browser requests. Non-browser clients send no
  `Origin` or `Sec-Fetch-Site` header and pass.
- **Login throttling**: 5 attempts per minute per (client IP, username), kept in
  memory, which assumes a single API process. Behind nginx, set
  `TRUST_PROXY=true`; the client IP is then taken from the *last*
  `X-Forwarded-For` hop, the one added by the proxy.
- **Roles**:

  | Role | Can |
  |---|---|
  | `viewer` | read and export everything (the default for any operation) |
  | `researcher` | register repositories, start or cancel collections, list credentials |
  | `admin` | manage users and credentials |
- **Enforcement.** Each huma operation declares its role in metadata
  (`Metadata: access.Require(access.Researcher)` or `access.Public()`), and the
  single `auth.RequireRole` middleware enforces it. Operations are deny-by-default:
  without metadata they require `viewer`. The OpenAPI `security` section is
  generated from the same metadata, so the docs can't drift from what's
  enforced.
- **Bootstrap.** There's no self-signup. Create the first admin with
  `raisectl user create -username admin -role admin`; admins then manage users
  via `/api/users`.

---

## 9. HTTP API

The API uses huma v2 on chi (`humachi`). The OpenAPI 3.1 spec is served at
`/api/openapi.json` and interactive docs at `/api/docs`.

| Area | Endpoints |
|---|---|
| auth | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/password`, `GET/POST /api/auth/api-keys`, `DELETE /api/auth/api-keys/{id}` |
| users (admin) | `GET/POST /api/users`, `PATCH /api/users/{id}` |
| platforms | `GET /api/platforms` |
| credentials | `GET/POST /api/credentials`, `POST /api/credentials/{id}/test`, `DELETE /api/credentials/{id}` |
| collections | `POST/GET /api/collections`, `GET /api/collections/{id}`, `POST /api/collections/{id}/cancel` |
| git | `POST/GET /api/repositories`, `GET /api/repositories/{id}`, `GET /api/repositories/{id}/commits`, `GET /api/repositories/{id}/commits/{sha}` |
| github | `GET /api/github/repositories/{id}`, `GET /api/github/repositories/{id}/issues`, `GET /api/github/repositories/{id}/issues/{number}`, `GET /api/github/repositories/{id}/pull-requests`, `GET /api/github/repositories/{id}/pull-requests/{number}` |
| health | `GET /healthz` |

**Schema names.** huma names each OpenAPI schema after its Go type, and the
names must be unique across the whole API. Response types therefore follow the
table naming convention: git's are unprefixed (`Repository`, `Commit`), and a
platform's types carry the platform prefix (`GitHubRepository`, `GitHubIssue`,
`GitHubPullRequest`), just as its tables do. The prefix stutters in Go
(`github.GitHubIssue`), but it keeps two platforms' `Issue` types from
colliding.

Handlers return `httpapi.Error(err)`, which maps the `apperr` sentinels to
status codes:

| Error | Status |
|---|---|
| `ErrNotFound` | 404 |
| `ErrInvalid` | 422 |
| `ErrConflict` | 409 |
| `ErrUnauthorized` | 401 |
| `ErrForbidden` | 403 |
| `ErrNotImplemented` | 501 |
| anything else | 500, logged; the body never contains the internal error |

---

## 10. Persistence

- The driver is pgx v5, with sqlc for type-safe queries. `make generate` runs
  sqlc v1.31.1.
- sqlc settings: nullable columns become pointers; `jsonb` maps to
  `json.RawMessage`; `omit_unused_structs` keeps each package's models limited
  to its own tables.
- Bulk writes use sqlc `:batchexec` (pipelined) or `unnest()` arrays.
- Migrations are embedded in the binaries. `raisectl migrate up` applies River's
  migrations first, then the app's goose migrations.
- Table and column naming conventions, every implemented table, and the planned
  tables for platforms not built yet are documented in
  [database.md](database.md).

---

## 11. Running it

```sh
cp .env.example .env
go run ./cmd/raisectl keygen          # paste into ENCRYPTION_KEYS
docker compose up --build             # db, migrate, api (:8000), worker
docker compose run --rm migrate raisectl user create -username admin -role admin
```

Without Docker, set `DATABASE_URL` and `ENCRYPTION_KEYS`, then run
`make migrate`, `make api` and `make worker`. The worker needs `git` on its
`PATH`.

Configuration is read from environment variables (see `app/config.go` and
`.env.example`).

---

## 12. Status

Implemented and verified end-to-end against Postgres (one Hello-World
collection and one 1,118-commit spf13/cobra collection):

- Auth: login, roles, API keys, CSRF, admin user management, raisectl bootstrap.
- Credentials: encrypted storage, per-platform tests, leasing with quota
  tracking.
- Collections: transactional start, sharded progress, reconcile, cancel.
- Git: registration, mirrors, incremental planning, parallel batch mining.
- GitHub (GraphQL): repository metadata, issues and pull requests with
  comments, timeline events, commits, reviews and review comments. Includes
  credential rotation, rate limits, secondary limits and timeout splitting.
  Verified against spf13/cobra: every issue, PR, comment, PR commit, review
  and review thread matched GitHub's totals. An incremental (`since`) run
  re-mined only the updated items.

TODO, in rough priority order:

- GitHub: `EnrichCommits` (commit → login/PR via `OnCommitsMined`, filling
  `github_commits` and `github_commit_pull_requests`), releases, users.
- Jira and Stack Overflow collection jobs: port from the Python miners using the
  plan → page pattern. Jira can split large ranges with `jobkit.SplitWindows`.
- GitLab enrichment, plus scoping credentials by host for self-managed
  instances.
- Dashboards and exports (CSV/JSON/Parquet), served from the API or written by
  jobs.
- Keyset pagination for large listings; currently `limit`/`offset`.
- Diff-on-demand from mirrors, which requires the API to reach the mirror
  volume.
- Frontend migration from SimpleJWT tokens to cookie sessions (`/api/auth/*`).

---

## 13. Decision log

| Decision | Why |
|---|---|
| River on Postgres instead of Celery + Redis | transactional enqueue, one datastore, snooze and unique jobs built in |
| Small idempotent jobs | parallelism across workers and tokens; cheap retries; safe re-runs |
| Platforms as vertical slices behind capability interfaces | adding a platform doesn't touch shared code |
| Git as the base platform; forges implement `git.Enricher` | the repository is the central concept; the import direction expresses that |
| GitHub through GraphQL, not REST | one query per batch of items with all nested data instead of one request per resource per item; listing IDs then fetching batches in parallel keeps the parallelism despite cursor pagination |
| Drop pydriller; git CLI + custom parser | performance on large histories; no Python dependency |
| Commits keyed by SHA and shared across repositories | forks are common in mining datasets and are stored once |
| huma for HTTP | OpenAPI generated from Go types; operation metadata drives authorization |
| Local accounts, scs sessions + API keys, no JWT | lab-hosted instance with a same-origin SPA; instant revocation; scripts get API keys |
| Lab-wide credential pool | data is shared across the lab; admins manage quota centrally |
| Sharded progress counters + periodic reconcile | no hot-row contention; no race on "last job finished" |

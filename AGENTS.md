# AGENTS.md

Guidance for AI coding agents working in this repository.

## Repository layout

| Path | What it is |
|---|---|
| `backend-go/` | The Go backend: a rewrite of `backend/` using River jobs and the huma HTTP API. New backend work goes here. |
| `backend/` | The legacy Django/Celery backend. Treat it as reference for porting miners; don't add features to it. |
| `frontend/` | The React/Vite frontend. |

## Before writing backend code: read the design docs

When working in `backend-go/`, read these first and follow them:

- **[backend-go/architecture.md](backend-go/architecture.md):** how the code
  is organised. It covers platforms as vertical slices, the import rules,
  job conventions (small, idempotent, transactional fan-out), credentials,
  auth, and the HTTP layer.
- **[backend-go/database.md](backend-go/database.md):** every table and
  column, the **naming conventions**, and the **planned** schema for platforms
  that aren't implemented yet. When you implement a planned table, start from
  its design there.
- **[backend-go/README.md](backend-go/README.md):** how to run, test and
  deploy.

The names you choose matter most. Platform timestamps are prefixed with the
platform (`github_created_at`); our own are `created_at`/`updated_at`; mining
times are `first_mined_at`/`last_mined_at`. See database.md's naming
conventions before adding any table or column. API JSON fields use the same
names as the columns.

## Keep the docs up to date

These documents are part of the code. Update them **in the same change** as the
code they describe:

- **database.md:**
  - Any migration that adds, changes or removes a table or column.
  - Implementing a planned (📝) table: move it to ✅ with its migration file
    and final columns.
  - A changed design for a planned table.
- **architecture.md:**
  - New packages, interfaces, job patterns or dependency rules.
  - Changes to the platform contracts, credentials, auth or the HTTP
    conventions.
  - Moving items in the status/TODO section.
- **README.md:** new commands, configuration variables, endpoints or
  deployment steps.

If code and docs disagree, either fix the code to match the docs, or update
the docs and explain why in your summary. Never leave them inconsistent.

## Working in backend-go

- Database changes:
  - Add a new migration in `internal/db/migrations/`. Never edit a migration
    that has been applied outside development.
  - Put queries in the owning package's `query.sql`, then run `make generate`.
  - Never hand-edit generated `sqlc/` code.
- Respect the import rules enforced by `.golangci.yml` (depguard). Don't loosen
  a rule to make code compile; restructure the code instead, or discuss the
  change.
- Model new platforms on `internal/platform/github`, the reference
  implementation. Every job must be idempotent: its args fully describe the
  work, and all writes are upserts.
- Tests: put all of a package's tests in a single `<package>_test.go` next to
  its code (e.g. `internal/platform/github/github_test.go`), in the same
  package, with larger fixtures in `testdata/`. Don't add `tests/`
  folders or extra `_test.go` files. See architecture.md §2.1.
- Before finishing, run from `backend-go/`:

  ```sh
  make generate   # if queries or migrations changed; generated code must be committed
  make test
  make lint
  ```

  For changes to SQL, migrations or job flow, also run the stack (see README)
  and exercise the affected path end to end.

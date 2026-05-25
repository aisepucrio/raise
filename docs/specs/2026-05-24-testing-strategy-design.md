# Testing Strategy Design

**Date:** 2026-05-24
**Branch:** `feat/testing-strategy`
**Status:** Approved — ready for implementation

---

## Overview

RAISE is a polyglot repo (Django backend + React frontend + Playwright E2E). This spec defines a three-tier testing architecture that respects each ecosystem's conventions and unifies all test execution under a single root `Makefile`.

---

## Goals

- Give every tier a consistent, discoverable test structure
- Run any tier (or all tiers) with a short `make` command
- Port existing test assets from the url-paste branch into the new structure
- Produce a reviewable branch for colleagues before adding new test coverage

## Non-Goals

- Writing new test cases beyond porting existing ones
- React Testing Library (RTL) — deferred until needed
- CI/GitHub Actions workflow — deferred to a follow-up PR
- Coverage thresholds or enforcement

---

## Architecture: Approach A — Three-Tier In-Place

Each tier lives where its ecosystem expects it. The root `Makefile` is the single entry point.

```
raise/
├── Makefile                             # single test entry point
├── backend/
│   ├── github/
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── factories.py
│   │       ├── test_api.py
│   │       └── test_tasks.py
│   ├── jira/
│   │   └── tests/  (same structure)
│   ├── stackoverflow/
│   │   └── tests/  (same structure)
│   └── jobs/
│       └── tests/  (same structure)
├── frontend/
│   ├── vitest.config.ts
│   └── src/
│       └── utils/
│           ├── parseCollectUrl.ts
│           └── parseCollectUrl.test.ts
└── tests/
    └── e2e/                             # unchanged
```

---

## Section 1 — Root Makefile

The root `package.json` (which previously held only Playwright scripts) is deleted. All test commands live in the Makefile.

```makefile
.PHONY: test test-backend test-backend-github test-backend-jira \
        test-backend-so test-backend-jobs test-frontend \
        test-frontend-watch test-ui test-e2e test-full test-report

# ── Backend ───────────────────────────────────────────────
test-backend:
	cd backend && uv run python manage.py test

test-backend-github:
	cd backend && uv run python manage.py test github

test-backend-jira:
	cd backend && uv run python manage.py test jira

test-backend-so:
	cd backend && uv run python manage.py test stackoverflow

test-backend-jobs:
	cd backend && uv run python manage.py test jobs

# ── Frontend (Vitest) ─────────────────────────────────────
test-frontend:
	cd frontend && npx vitest run

test-frontend-watch:
	cd frontend && npx vitest

# ── E2E (Playwright) ──────────────────────────────────────
test-ui:
	npx playwright test --project=ui

test-e2e:
	npx playwright test --project=e2e

test-full:
	npx playwright test

test-report:
	npx playwright show-report

# ── All tiers (no Docker required) ────────────────────────
test:
	$(MAKE) test-backend
	$(MAKE) test-frontend
	$(MAKE) test-ui
```

`make test` runs all three tiers without Docker. `make test-full` requires the Docker stack.

---

## Section 2 — Backend Test Packages

Each app's monolithic `tests.py` is replaced by a `tests/` package.

**File layout per app:**

```
<app>/tests/
├── __init__.py
├── factories.py       # factory_boy model factories
├── test_api.py        # endpoint tests (status codes, response shape, validation)
└── test_tasks.py      # Celery task tests (mocked, logic flow)
```

**Factory pattern:**

```python
# github/tests/factories.py
import factory
from github.models import GitHubMetadata, GitHubCommit, GitHubAuthor

class GitHubMetadataFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubMetadata
    repository = "pandas-dev/pandas"
    owner = "pandas-dev"
    stars_count = factory.Faker("random_int", min=0, max=10000)
    # all required fields have sensible defaults; override per-test as needed

class GitHubAuthorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubAuthor
    name = factory.Faker("name")
    email = factory.Faker("email")

class GitHubCommitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubCommit
    repository = factory.SubFactory(GitHubMetadataFactory)
    sha = factory.Faker("sha1")
```

Existing test logic (`APITestCase` classes, assertion patterns) moves unchanged. Only `setUp` inline `objects.create()` calls are replaced with factory calls.

**Dependency:** `factory-boy` added to `backend/pyproject.toml` as a dev dependency.

---

## Section 3 — Frontend Vitest Setup

**Scope:** Utility/logic tests only. No component rendering, no RTL.

**`frontend/vitest.config.ts`:**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

`environment: 'node'` is correct for pure utility tests. Switch to `'jsdom'` when RTL is added later.

**`frontend/package.json` additions:**

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
},
"devDependencies": {
  "vitest": "^2.x",
  "@vitest/coverage-v8": "^2.x"
}
```

**Initial test file:** `frontend/src/utils/parseCollectUrl.test.ts` ported from the `feat/url-paste-collect-screens` branch (37 passing tests).

---

## Section 4 — E2E (No Changes)

`tests/e2e/` and `playwright.config.ts` are unchanged. The existing structure is already well-organised:

- POM pattern: `tests/e2e/pom/`
- Spec files: `tests/e2e/github/*.spec.ts`
- Split projects: `ui` (no Docker) and `e2e` (full stack)

---

## Section 5 — Change Inventory

| File / Path | Change |
|---|---|
| `Makefile` | Created |
| `package.json` (root) | Deleted |
| `backend/pyproject.toml` | Add `factory-boy` dev dependency |
| `backend/github/tests.py` | Deleted |
| `backend/github/tests/` | Created with `__init__.py`, `factories.py`, `test_api.py`, `test_tasks.py` |
| `backend/jira/tests.py` | Deleted |
| `backend/jira/tests/` | Created (same structure) |
| `backend/stackoverflow/tests.py` | Deleted |
| `backend/stackoverflow/tests/` | Created (same structure) |
| `backend/jobs/tests.py` | Deleted |
| `backend/jobs/tests/` | Created (same structure) |
| `frontend/vitest.config.ts` | Created |
| `frontend/package.json` | Add `vitest`, `@vitest/coverage-v8`, test scripts |
| `frontend/src/utils/parseCollectUrl.ts` | Ported from url-paste branch |
| `frontend/src/utils/parseCollectUrl.test.ts` | Ported from url-paste branch (37 tests) |
| `tests/e2e/` | No changes |
| `playwright.config.ts` | No changes |

---

## Future Work (Out of Scope)

- React Testing Library for component tests
- GitHub Actions CI workflow
- Coverage thresholds (`--coverage` flag, min % enforcement)
- Jira and Stack Overflow E2E specs

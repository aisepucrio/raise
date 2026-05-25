# Testing Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate RAISE to a three-tier testing architecture with a root Makefile as the single entry point, backend tests/ packages with factory_boy fixtures, and Vitest for frontend utilities.

**Architecture:** Approach A — three-tier in-place. Backend tests split into app-local `tests/` packages (Django convention). Frontend gets Vitest colocated with source (React convention). E2E at `tests/e2e/` is unchanged. Root `Makefile` unifies all three runners under short `make` targets. Root `package.json` is deleted (it only held Playwright npm scripts).

**Tech Stack:** Python 3.13 / Django 6 / uv, factory-boy 3.x, React 19 / Vite 7 / TypeScript, Vitest 3.x, Playwright 1.52 (existing, unchanged)

**Spec:** `docs/specs/2026-05-24-testing-strategy-design.md`

---

## File Map

| Action | Path |
|--------|------|
| Create | `Makefile` |
| Delete | `package.json` (root) |
| Modify | `backend/pyproject.toml` — add `[dependency-groups]` dev section |
| Delete | `backend/github/tests.py` |
| Create | `backend/github/tests/__init__.py` |
| Create | `backend/github/tests/factories.py` |
| Create | `backend/github/tests/test_api.py` |
| Create | `backend/github/tests/test_tasks.py` |
| Delete | `backend/jira/tests.py` |
| Create | `backend/jira/tests/__init__.py` |
| Create | `backend/jira/tests/factories.py` |
| Create | `backend/jira/tests/test_api.py` |
| Create | `backend/jira/tests/test_tasks.py` |
| Delete | `backend/stackoverflow/tests.py` |
| Create | `backend/stackoverflow/tests/__init__.py` |
| Create | `backend/stackoverflow/tests/factories.py` |
| Create | `backend/stackoverflow/tests/test_api.py` |
| Create | `backend/stackoverflow/tests/test_tasks.py` |
| Delete | `backend/jobs/tests.py` |
| Create | `backend/jobs/tests/__init__.py` |
| Create | `backend/jobs/tests/factories.py` |
| Create | `backend/jobs/tests/test_models.py` |
| Create | `frontend/vitest.config.ts` |
| Modify | `frontend/package.json` — add vitest devDeps + test scripts |
| Create | `frontend/src/sources/shared/parseCollectUrl.ts` (ported from url-paste branch) |
| Create | `frontend/src/sources/shared/parseCollectUrl.test.ts` (ported from url-paste branch) |
| No change | `tests/e2e/` |
| No change | `playwright.config.ts` |

---

## Task 1: Create Feature Branch

**Files:** none

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout main
git checkout -b feat/testing-strategy
```

Expected: `Switched to a new branch 'feat/testing-strategy'`

---

## Task 2: Add Root Makefile

**Files:**
- Create: `Makefile`

- [ ] **Step 1: Create the Makefile**

Create `Makefile` at the repo root with this exact content (use tabs, not spaces, for recipe indentation):

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

> **Important:** Makefile recipes MUST be indented with a tab character, not spaces. If your editor converts tabs to spaces, configure it to preserve tabs in `.mk`/`Makefile` files, or use `cat -A Makefile` to verify tab characters appear as `^I`.

- [ ] **Step 2: Verify syntax**

```bash
make --dry-run test-backend
```

Expected output (no errors):
```
cd backend && uv run python manage.py test
```

- [ ] **Step 3: Commit**

```bash
git add Makefile
git commit -m "build: add root Makefile for unified test entry point"
```

---

## Task 3: Delete Root package.json

**Files:**
- Delete: `package.json` (root)

The root `package.json` only held Playwright npm scripts. All those commands now live in the Makefile. Playwright is still installed via `node_modules/` at the root (installed previously); the `package.json` removal does not affect that.

- [ ] **Step 1: Verify the root package.json only contains Playwright scripts**

```bash
cat package.json
```

Expected: only `test:e2e`, `test:ui`, `test:full`, `test:report` scripts and `@playwright/test` devDependency. If it contains anything else, do not delete it — check with the team first.

- [ ] **Step 2: Delete the file**

```bash
rm package.json
```

- [ ] **Step 3: Verify Playwright still works via Makefile**

```bash
make --dry-run test-ui
```

Expected:
```
npx playwright test --project=ui
```

- [ ] **Step 4: Commit**

```bash
git add -u package.json
git commit -m "build: remove root package.json (scripts moved to Makefile)"
```

---

## Task 4: Add factory-boy to Backend Dev Dependencies

**Files:**
- Modify: `backend/pyproject.toml`

- [ ] **Step 1: Add `[dependency-groups]` section to pyproject.toml**

Open `backend/pyproject.toml`. After the closing `]` of the `dependencies` list, add:

```toml
[dependency-groups]
dev = [
    "factory-boy>=3.3.0",
]
```

The full file after the change ends with:

```toml
    "selenium==4.41.0",
]

[dependency-groups]
dev = [
    "factory-boy>=3.3.0",
]
```

- [ ] **Step 2: Install the dev dependency**

```bash
cd backend
uv sync --group dev
```

Expected: uv resolves and installs `factory-boy` and its dependency `Faker`.

- [ ] **Step 3: Verify factory-boy is importable**

```bash
cd backend
uv run python -c "import factory; print(factory.__version__)"
```

Expected: prints a version string like `3.3.0`.

- [ ] **Step 4: Commit**

```bash
git add backend/pyproject.toml backend/uv.lock
git commit -m "build(backend): add factory-boy dev dependency"
```

---

## Task 5: Migrate github/tests.py → github/tests/ Package

**Files:**
- Delete: `backend/github/tests.py`
- Create: `backend/github/tests/__init__.py`
- Create: `backend/github/tests/factories.py`
- Create: `backend/github/tests/test_api.py`
- Create: `backend/github/tests/test_tasks.py`

### Step 1 — Create the package skeleton

- [ ] **Create the tests/ directory and empty files**

```bash
mkdir backend/github/tests
touch backend/github/tests/__init__.py
touch backend/github/tests/test_tasks.py
```

`test_tasks.py` stays empty for now (the existing github tests don't have a dedicated task test class — all tests are in `GitHubAPITests`). Create it as a scaffold:

`backend/github/tests/test_tasks.py`:
```python
# GitHub Celery task tests
# Add task-level unit tests here as coverage grows.
```

### Step 2 — Create factories.py

- [ ] **Create `backend/github/tests/factories.py`**

```python
import factory
from django.utils import timezone

from github.models import (
    GitHubAuthor,
    GitHubBranch,
    GitHubCommit,
    GitHubIssue,
    GitHubMetadata,
    GitHubMethod,
    GitHubModifiedFile,
    GitHubPullRequest,
)


class GitHubMetadataFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubMetadata

    repository = factory.Sequence(lambda n: f"owner-{n}/repo-{n}")
    owner = factory.Sequence(lambda n: f"owner-{n}")
    organization = factory.Sequence(lambda n: f"owner-{n}")
    stars_count = 4242
    watchers_count = 4242
    forks_count = 100
    open_issues_count = 5
    default_branch = "main"
    description = "Test repo"
    html_url = factory.LazyAttribute(lambda o: f"https://github.com/{o.repository}")
    contributors_count = 3
    topics = ["ai", "nlp"]
    languages = {"Python": 10000}
    readme = "README"
    labels_count = 10
    github_created_at = factory.LazyFunction(timezone.now)
    github_updated_at = factory.LazyFunction(timezone.now)
    is_archived = False
    is_template = False
    used_by_count = 50
    releases_count = 2
    time_mined = factory.LazyFunction(timezone.now)


class GitHubAuthorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubAuthor

    name = factory.Sequence(lambda n: f"Author {n}")
    email = factory.Sequence(lambda n: f"author{n}@test.com")


class GitHubCommitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubCommit

    repository = factory.SubFactory(GitHubMetadataFactory)
    repository_name = factory.LazyAttribute(lambda o: o.repository.repository)
    sha = factory.Sequence(lambda n: f"{'a' * 39}{n}")
    message = "Test commit message"
    date = factory.LazyFunction(timezone.now)
    author = factory.SubFactory(GitHubAuthorFactory)
    committer = factory.SubFactory(GitHubAuthorFactory)
    insertions = 10
    deletions = 2
    files_changed = 1
    in_main_branch = True
    merge = False
    dmm_unit_size = 1.0
    dmm_unit_complexity = 1.0
    dmm_unit_interfacing = 1.0
    time_mined = factory.LazyFunction(timezone.now)


class GitHubModifiedFileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubModifiedFile

    commit = factory.SubFactory(GitHubCommitFactory)
    old_path = None
    new_path = "src/app.py"
    filename = "src/app.py"
    change_type = "M"
    diff = "---"
    added_lines = 10
    deleted_lines = 2
    complexity = 3
    time_mined = factory.LazyFunction(timezone.now)


class GitHubMethodFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubMethod

    modified_file = factory.SubFactory(GitHubModifiedFileFactory)
    name = "def foo()"
    complexity = 2
    max_nesting = 1
    time_mined = factory.LazyFunction(timezone.now)


class GitHubIssueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubIssue

    repository = factory.SubFactory(GitHubMetadataFactory)
    repository_name = factory.LazyAttribute(lambda o: o.repository.repository)
    issue_id = factory.Sequence(lambda n: 1000000000 + n)
    number = factory.Sequence(lambda n: n + 1)
    title = "Bug: something fails"
    state = "open"
    creator = "alice"
    assignees = ["bob"]
    labels = ["bug"]
    milestone = None
    locked = False
    github_created_at = factory.LazyFunction(timezone.now)
    github_updated_at = factory.LazyFunction(timezone.now)
    closed_at = None
    body = "Steps to reproduce..."
    comments = []
    timeline_events = []
    is_pull_request = False
    author_association = "CONTRIBUTOR"
    reactions = {"+1": 1}
    time_mined = factory.LazyFunction(timezone.now)


class GitHubPullRequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubPullRequest

    pr_id = factory.Sequence(lambda n: 900000000 + n)
    repository = factory.SubFactory(GitHubMetadataFactory)
    repository_name = factory.LazyAttribute(lambda o: o.repository.repository)
    number = factory.Sequence(lambda n: n + 10)
    title = "Add feature"
    state = "open"
    creator = "bob"
    github_created_at = factory.LazyFunction(timezone.now)
    github_updated_at = factory.LazyFunction(timezone.now)
    closed_at = None
    merged_at = None
    labels = ["enhancement"]
    commits = []
    comments = []
    body = "Implements feature X"
    time_mined = factory.LazyFunction(timezone.now)


class GitHubBranchFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubBranch

    repository = factory.SubFactory(GitHubMetadataFactory)
    repository_name = factory.LazyAttribute(lambda o: o.repository.repository)
    name = factory.Sequence(lambda n: f"branch-{n}")
    sha = factory.Sequence(lambda n: f"{'b' * 39}{n}")
    is_default = False
    time_mined = factory.LazyFunction(timezone.now)
```

### Step 3 — Create test_api.py

- [ ] **Create `backend/github/tests/test_api.py`**

Copy the full content of `backend/github/tests.py` into `backend/github/tests/test_api.py`. The content is identical — no changes to test logic. The file will contain the `GitHubAPITests` class with all its test methods.

The imports at the top of the file remain exactly as they were in `tests.py`:

```python
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock
from django.utils import timezone
import uuid
from datetime import datetime

from github.models import (
    GitHubMetadata, GitHubCommit, GitHubAuthor, GitHubModifiedFile, GitHubMethod,
    GitHubIssue, GitHubPullRequest, GitHubBranch
)

from github.miners.base import BaseMiner
from jobs.models import Task
```

All test methods in `GitHubAPITests` stay unchanged.

> **Note on factories:** The setUp still uses `objects.create()` inline. Factories are available in `factories.py` for future test additions — refactoring setUp to use them is follow-up work outside this branch's scope.

### Step 4 — Delete the old tests.py and verify

- [ ] **Delete the old file**

```bash
rm backend/github/tests.py
```

- [ ] **Run github tests to confirm nothing broke**

```bash
cd backend && uv run python manage.py test github
```

Expected: all tests pass, output ends with `OK`.

- [ ] **Commit**

```bash
git add backend/github/
git commit -m "refactor(github): migrate tests.py to tests/ package with factories"
```

---

## Task 6: Migrate jira/tests.py → jira/tests/ Package

**Files:**
- Delete: `backend/jira/tests.py`
- Create: `backend/jira/tests/__init__.py`
- Create: `backend/jira/tests/factories.py`
- Create: `backend/jira/tests/test_api.py`
- Create: `backend/jira/tests/test_tasks.py`

### Step 1 — Create the package skeleton

- [ ] **Create directory and __init__.py**

```bash
mkdir backend/jira/tests
touch backend/jira/tests/__init__.py
```

### Step 2 — Create factories.py

- [ ] **Create `backend/jira/tests/factories.py`**

```python
import factory
from django.utils import timezone

from jira.models import (
    JiraActivityLog,
    JiraChecklist,
    JiraComment,
    JiraCommit,
    JiraHistory,
    JiraHistoryItem,
    JiraIssue,
    JiraIssueLink,
    JiraIssueType,
    JiraProject,
    JiraSprint,
    JiraUser,
)


class JiraUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraUser

    accountId = factory.Sequence(lambda n: f"user-{n}")
    displayName = factory.Sequence(lambda n: f"Test User {n}")
    emailAddress = factory.Sequence(lambda n: f"user{n}@test.com")
    active = True
    timeZone = "UTC"
    accountType = "atlassian"


class JiraProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraProject

    id = factory.Sequence(lambda n: f"proj-{n}")
    key = factory.Sequence(lambda n: f"PROJ{n}")
    name = factory.Sequence(lambda n: f"Project {n}")
    simplified = False
    projectTypeKey = "software"


class JiraIssueTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraIssueType

    name = "Story"
    description = "A user story"


class JiraSprintFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraSprint

    sprint_id = factory.Sequence(lambda n: n + 1)
    name = factory.Sequence(lambda n: f"Sprint {n}")
    state = "active"
    start_date = factory.LazyFunction(timezone.now)
    end_date = factory.LazyFunction(timezone.now)


class JiraIssueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraIssue

    issue_id = factory.Sequence(lambda n: f"PROJ-{n}")
    issue_key = factory.Sequence(lambda n: f"PROJ-{n}")
    project = factory.SubFactory(JiraProjectFactory)
    created = factory.LazyFunction(timezone.now)
    updated = factory.LazyFunction(timezone.now)
    status = "To Do"
    summary = factory.Sequence(lambda n: f"Issue {n}")
    creator = factory.SubFactory(JiraUserFactory)
    reporter = factory.SubFactory(JiraUserFactory)


class JiraCommentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraComment

    issue = factory.SubFactory(JiraIssueFactory)
    author = factory.SubFactory(JiraUserFactory)
    body = "A test comment"
    created = factory.LazyFunction(timezone.now)
    updated = factory.LazyFunction(timezone.now)


class JiraCommitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraCommit

    issue = factory.SubFactory(JiraIssueFactory)
    commit_id = factory.Sequence(lambda n: f"commit-{n}")
    message = "Test commit"
    author = "Test Author"
    created = factory.LazyFunction(timezone.now)


class JiraActivityLogFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraActivityLog

    issue = factory.SubFactory(JiraIssueFactory)
    author = factory.SubFactory(JiraUserFactory)
    created = factory.LazyFunction(timezone.now)
    description = "Status changed"
```

### Step 3 — Split test_api.py and test_tasks.py

The existing `jira/tests.py` has three classes:
- `JiraAPITests` — API endpoint tests → goes in `test_api.py`
- `JiraApiValidationTests` — validation tests → goes in `test_api.py`
- `JiraTasksTests` — Celery task tests → goes in `test_tasks.py`

- [ ] **Create `backend/jira/tests/test_api.py`**

Copy the imports block and the `JiraAPITests` and `JiraApiValidationTests` classes from `jira/tests.py` into `test_api.py`. The imports are:

```python
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock
import uuid
from django.utils import timezone

from jira.models import (
    JiraIssue, JiraProject, JiraUser, JiraComment, JiraSprint,
    JiraIssueType, JiraHistory, JiraHistoryItem, JiraCommit,
    JiraChecklist, JiraIssueLink, JiraActivityLog
)
from jira.miner import JiraMiner
from jobs.models import Task
```

Then paste `JiraAPITests` and `JiraApiValidationTests` exactly as they appear in `jira/tests.py`.

- [ ] **Create `backend/jira/tests/test_tasks.py`**

Use the same imports block, then paste only `JiraTasksTests`:

```python
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock
import uuid
from django.utils import timezone

from jira.models import (
    JiraIssue, JiraProject, JiraUser, JiraComment, JiraSprint,
    JiraIssueType, JiraHistory, JiraHistoryItem, JiraCommit,
    JiraChecklist, JiraIssueLink, JiraActivityLog
)
from jira.miner import JiraMiner
from jobs.models import Task
```

Then paste the `JiraTasksTests` class exactly as it appears in `jira/tests.py`.

### Step 4 — Delete old tests.py and verify

- [ ] **Delete the old file**

```bash
rm backend/jira/tests.py
```

- [ ] **Run jira tests**

```bash
cd backend && uv run python manage.py test jira
```

Expected: all tests pass, output ends with `OK`.

- [ ] **Commit**

```bash
git add backend/jira/
git commit -m "refactor(jira): migrate tests.py to tests/ package with factories"
```

---

## Task 7: Migrate stackoverflow/tests.py → stackoverflow/tests/ Package

**Files:**
- Delete: `backend/stackoverflow/tests.py`
- Create: `backend/stackoverflow/tests/__init__.py`
- Create: `backend/stackoverflow/tests/factories.py`
- Create: `backend/stackoverflow/tests/test_api.py`
- Create: `backend/stackoverflow/tests/test_tasks.py`

### Step 1 — Create skeleton

- [ ] **Create directory and __init__.py**

```bash
mkdir backend/stackoverflow/tests
touch backend/stackoverflow/tests/__init__.py
```

### Step 2 — Create factories.py

- [ ] **Create `backend/stackoverflow/tests/factories.py`**

```python
import factory
from django.utils import timezone

from stackoverflow.models import StackQuestion, StackTag, StackUser


class StackUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = StackUser

    user_id = factory.Sequence(lambda n: n + 1)
    display_name = factory.Sequence(lambda n: f"User {n}")
    reputation = 100
    time_mined = factory.LazyFunction(timezone.now)


class StackTagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = StackTag

    name = factory.Sequence(lambda n: f"tag-{n}")


class StackQuestionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = StackQuestion

    question_id = factory.Sequence(lambda n: 100 + n)
    title = factory.Sequence(lambda n: f"Question {n}")
    owner = factory.SubFactory(StackUserFactory)
    score = 10
```

### Step 3 — Split into test_api.py and test_tasks.py

The existing `stackoverflow/tests.py` has two classes:
- `StackOverflowAPITests` → `test_api.py`
- `StackOverflowTasksTests` → `test_tasks.py`

- [ ] **Create `backend/stackoverflow/tests/test_api.py`**

Copy imports and `StackOverflowAPITests` exactly:

```python
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock
import uuid

from stackoverflow.models import StackUser, StackQuestion, StackTag
from jobs.models import Task
```

Then paste `StackOverflowAPITests` as-is.

- [ ] **Create `backend/stackoverflow/tests/test_tasks.py`**

Same imports, then paste `StackOverflowTasksTests` as-is.

### Step 4 — Delete and verify

- [ ] **Delete the old file**

```bash
rm backend/stackoverflow/tests.py
```

- [ ] **Run stackoverflow tests**

```bash
cd backend && uv run python manage.py test stackoverflow
```

Expected: all tests pass, output ends with `OK`.

- [ ] **Commit**

```bash
git add backend/stackoverflow/
git commit -m "refactor(stackoverflow): migrate tests.py to tests/ package with factories"
```

---

## Task 8: Migrate jobs/tests.py → jobs/tests/ Package

**Files:**
- Delete: `backend/jobs/tests.py`
- Create: `backend/jobs/tests/__init__.py`
- Create: `backend/jobs/tests/factories.py`
- Create: `backend/jobs/tests/test_models.py`

The current `jobs/tests.py` is empty (Django scaffold only). This task creates the structure and a `TaskFactory` ready for use.

### Step 1 — Create skeleton

- [ ] **Create directory and files**

```bash
mkdir backend/jobs/tests
touch backend/jobs/tests/__init__.py
```

### Step 2 — Create factories.py

- [ ] **Create `backend/jobs/tests/factories.py`**

```python
import factory
from django.utils import timezone

from jobs.models import Task


class TaskFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Task

    task_id = factory.Sequence(lambda n: f"task-id-{n}")
    operation = "collect_commits"
    repository = factory.Sequence(lambda n: f"owner-{n}/repo-{n}")
    type = "GITHUB"
    status = "PENDING"
    created_at = factory.LazyFunction(timezone.now)
```

### Step 3 — Create test_models.py

- [ ] **Create `backend/jobs/tests/test_models.py`**

```python
from django.test import TestCase

from jobs.tests.factories import TaskFactory


class TaskModelTests(TestCase):
    def test_task_str(self):
        task = TaskFactory(operation="collect_commits", repository="owner/repo")
        self.assertIn("collect_commits", str(task))
        self.assertIn("owner/repo", str(task))

    def test_task_default_status(self):
        task = TaskFactory()
        self.assertEqual(task.status, "PENDING")
```

### Step 4 — Delete old tests.py and verify

- [ ] **Delete the old file**

```bash
rm backend/jobs/tests.py
```

- [ ] **Run jobs tests**

```bash
cd backend && uv run python manage.py test jobs
```

Expected: 2 tests pass, output ends with `OK`.

- [ ] **Run full backend suite to confirm nothing regressed**

```bash
cd backend && uv run python manage.py test
```

Expected: all tests pass, output ends with `OK`.

- [ ] **Commit**

```bash
git add backend/jobs/
git commit -m "refactor(jobs): migrate tests.py to tests/ package with TaskFactory"
```

---

## Task 9: Frontend Vitest Setup

**Files:**
- Create: `frontend/vitest.config.ts`
- Modify: `frontend/package.json`

### Step 1 — Install Vitest

- [ ] **Add Vitest to frontend devDependencies**

```bash
cd frontend
npm install --save-dev vitest@^3.0.0 @vitest/coverage-v8@^3.0.0
```

Expected: `package.json` devDependencies gains `"vitest": "^3.x.x"` and `"@vitest/coverage-v8": "^3.x.x"`. `package-lock.json` is updated.

### Step 2 — Add test scripts to package.json

- [ ] **Add scripts to `frontend/package.json`**

In the `"scripts"` object, add after `"preview"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

The scripts section should now look like:

```json
"scripts": {
  "dev": "vite --host 0.0.0.0",
  "build": "vite build",
  "start": "vite build --watch",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build"
}
```

### Step 3 — Create vitest.config.ts

- [ ] **Create `frontend/vitest.config.ts`**

```typescript
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

`environment: "node"` is correct for pure utility tests. Switch to `"jsdom"` when React Testing Library is added later.

### Step 4 — Verify Vitest runs (with no tests yet)

- [ ] **Run vitest**

```bash
cd frontend && npx vitest run
```

Expected: `No test files found` or exit 0 with 0 tests. This confirms Vitest is correctly configured before adding test files.

- [ ] **Commit**

```bash
git add frontend/vitest.config.ts frontend/package.json frontend/package-lock.json
git commit -m "build(frontend): add Vitest with node environment for utility tests"
```

---

## Task 10: Port parseCollectUrl Files from url-paste Branch

**Files:**
- Create: `frontend/src/sources/shared/parseCollectUrl.ts`
- Create: `frontend/src/sources/shared/parseCollectUrl.test.ts`

The `parseCollectUrl` utility and its 37 tests live on the `origin/feat/url-paste-collect-screens` branch at `frontend/src/sources/shared/`. Port them to the same path on this branch.

### Step 1 — Extract files from the url-paste branch

- [ ] **Show and save parseCollectUrl.ts**

```bash
git show origin/feat/url-paste-collect-screens:frontend/src/sources/shared/parseCollectUrl.ts
```

Copy the full output and create `frontend/src/sources/shared/parseCollectUrl.ts` with that exact content.

- [ ] **Show and save parseCollectUrl.test.ts**

```bash
git show origin/feat/url-paste-collect-screens:frontend/src/sources/shared/parseCollectUrl.test.ts
```

Copy the full output and create `frontend/src/sources/shared/parseCollectUrl.test.ts` with that exact content.

### Step 2 — Run the tests

- [ ] **Run frontend tests**

```bash
cd frontend && npx vitest run
```

Expected: 37 tests found and passing. Output ends with something like:
```
Test Files  1 passed (1)
Tests       37 passed (37)
```

If any tests fail, check that the `@` alias in `vitest.config.ts` resolves correctly to `./src`.

- [ ] **Verify via Makefile target**

```bash
make test-frontend
```

Expected: same passing output.

- [ ] **Commit**

```bash
git add frontend/src/sources/shared/parseCollectUrl.ts frontend/src/sources/shared/parseCollectUrl.test.ts
git commit -m "test(frontend): port parseCollectUrl utility and 37 tests from url-paste branch"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run full backend suite**

```bash
make test-backend
```

Expected: all tests pass, `OK`.

- [ ] **Step 2: Run frontend tests**

```bash
make test-frontend
```

Expected: 37 tests pass.

- [ ] **Step 3: Run UI-only E2E (no Docker needed)**

```bash
make test-ui
```

Expected: Playwright runs `collect-repository.spec.ts` and `collect-scope.spec.ts` against `http://localhost:5173`. Requires the frontend dev server to be running (`npm run dev` in another terminal). Tests pass.

- [ ] **Step 4: Run make test (all tiers)**

```bash
make test
```

Expected: backend → frontend → UI E2E all pass in sequence.

- [ ] **Step 5: Check branch is clean and ready for PR**

```bash
git log main..HEAD --oneline
```

Expected: 8–10 commits on this branch, all with meaningful messages.

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

---

## Self-Review Notes

**Spec coverage:**
- ✅ Root Makefile — Task 2
- ✅ Delete root package.json — Task 3
- ✅ factory-boy added — Task 4
- ✅ github tests/ package — Task 5
- ✅ jira tests/ package — Task 6
- ✅ stackoverflow tests/ package — Task 7
- ✅ jobs tests/ package — Task 8
- ✅ Frontend Vitest setup — Task 9
- ✅ parseCollectUrl ported — Task 10
- ✅ E2E unchanged — noted throughout
- ✅ All on feat/testing-strategy — Task 1

**No placeholders:** All steps have exact code, exact commands, exact expected output.

**Type consistency:** `TaskFactory` defined in Task 8 factories.py, used in Task 8 test_models.py only — consistent.

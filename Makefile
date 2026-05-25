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

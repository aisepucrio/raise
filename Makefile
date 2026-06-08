.PHONY: \
	infra-up infra-down infra-build infra-reset infra-logs infra-ps \
	test test-backend test-backend-github test-backend-jira \
	test-backend-so test-backend-jobs test-frontend \
	test-frontend-watch test-e2e test-all test-report

# ── Infrastructure ────────────────────────────────────────
infra-up:
	docker compose up -d

infra-down:
	docker compose down

infra-build:
	docker compose up -d --build

infra-reset:
	docker compose down -v --remove-orphans && docker compose up -d --build

infra-logs:
	docker compose logs -f

infra-ps:
	docker compose ps

# ── Backend ───────────────────────────────────────────────
test-backend:
	docker compose exec raiseapi uv run python manage.py test

test-backend-github:
	docker compose exec raiseapi uv run python manage.py test github

test-backend-jira:
	docker compose exec raiseapi uv run python manage.py test jira

test-backend-so:
	docker compose exec raiseapi uv run python manage.py test stackoverflow

test-backend-jobs:
	docker compose exec raiseapi uv run python manage.py test jobs

# ── Frontend (Vitest) ─────────────────────────────────────
test-frontend:
	cd frontend && npx vitest run

test-frontend-watch:
	cd frontend && npx vitest

# ── E2E (Playwright) ──────────────────────────────────────
test-e2e:
	npx playwright test

test-report:
	npx playwright show-report

# ── All tiers ─────────────────────────────────────────────
# test: fast tier — no Docker stack required beyond the running raiseapi container
test:
	$(MAKE) test-backend
	$(MAKE) test-frontend

# test-all: all tiers — requires `make infra-up` first
test-all:
	$(MAKE) test-backend
	$(MAKE) test-frontend
	$(MAKE) test-e2e

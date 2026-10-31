SQLC_VERSION     := v1.31.1
GOLANGCI_VERSION := v2.14.0

# Postgres runs from the repository's docker-compose.yaml; configuration lives
# in ../.env (export it before running the binaries: set -a; source ../.env; set +a).
COMPOSE := docker compose -f ../docker-compose.yaml

.PHONY: generate lint test build migrate api worker db reset-db keygen user

generate: ## Regenerate sqlc code from migrations + query.sql files
	go run github.com/sqlc-dev/sqlc/cmd/sqlc@$(SQLC_VERSION) generate

lint: ## Run linters, including the depguard import rules
	go run github.com/golangci/golangci-lint/v2/cmd/golangci-lint@$(GOLANGCI_VERSION) run ./...

test:
	go test ./...

build:
	go build -o bin/ ./cmd/...

migrate:
	go run ./cmd/raisectl migrate up

api:
	go run ./cmd/api

worker:
	go run ./cmd/worker

db: ## Start only Postgres (for running the binaries locally)
	$(COMPOSE) up -d --wait db

reset-db: ## Drop ALL local data (app tables, River jobs, sessions) and re-apply migrations
	$(COMPOSE) exec -T db psql -U raise -d raise -v ON_ERROR_STOP=1 -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
	go run ./cmd/raisectl migrate up

keygen: ## Print a new ENCRYPTION_KEYS value
	go run ./cmd/raisectl keygen

user: ## Create a user interactively: make user USERNAME=alice ROLE=admin
	go run ./cmd/raisectl user create -username $(USERNAME) -role $(or $(ROLE),researcher)

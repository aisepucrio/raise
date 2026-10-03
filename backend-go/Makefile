SQLC_VERSION     := v1.31.1
GOLANGCI_VERSION := v2.14.0

.PHONY: generate lint test build migrate api worker db keygen user

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
	docker compose up -d --wait db

keygen: ## Print a new ENCRYPTION_KEYS value
	go run ./cmd/raisectl keygen

user: ## Create a user interactively: make user USERNAME=alice ROLE=admin
	go run ./cmd/raisectl user create -username $(USERNAME) -role $(or $(ROLE),researcher)

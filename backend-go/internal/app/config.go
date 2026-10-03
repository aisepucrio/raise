// Package app is the composition root: it reads configuration, builds every
// dependency and wires packages together. It contains no domain logic.
package app

import (
	"log/slog"
	"os"

	"github.com/caarlos0/env/v11"
)

type Config struct {
	DatabaseURL    string `env:"DATABASE_URL,required"`
	EncryptionKeys string `env:"ENCRYPTION_KEYS,required" envDescription:"credential encryption keys, e.g. 1:<base64>; generate with raisectl keygen"`
	LogLevel       string `env:"LOG_LEVEL" envDefault:"info"`

	// API
	HTTPAddr      string `env:"HTTP_ADDR" envDefault:":8000"`
	SecureCookies bool   `env:"SECURE_COOKIES" envDefault:"false"`
	TrustProxy    bool   `env:"TRUST_PROXY" envDefault:"false"`

	// Git
	GitMirrorDir       string `env:"GIT_MIRROR_DIR" envDefault:"./data/mirrors"`
	GitBinary          string `env:"GIT_BINARY" envDefault:"git"`
	GitCommitBatchSize int    `env:"GIT_COMMIT_BATCH_SIZE" envDefault:"500"`
	GitConcurrency     int    `env:"GIT_CONCURRENCY"`

	// Forges
	GitHubAPIURL      string   `env:"GITHUB_API_URL" envDefault:"https://api.github.com"`
	GitHubHosts       []string `env:"GITHUB_HOSTS" envDefault:"github.com" envSeparator:","`
	GitHubConcurrency int      `env:"GITHUB_CONCURRENCY" envDefault:"20"`
	GitLabHosts       []string `env:"GITLAB_HOSTS" envDefault:"gitlab.com" envSeparator:","`
}

func LoadConfig() (Config, error) {
	return env.ParseAs[Config]()
}

func NewLogger(level string) *slog.Logger {
	var l slog.Level
	if err := l.UnmarshalText([]byte(level)); err != nil {
		l = slog.LevelInfo
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: l}))
	slog.SetDefault(logger)
	return logger
}

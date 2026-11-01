package app

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"

	"raise/internal/auth"
	"raise/internal/collection"
	"raise/internal/credential"
	"raise/internal/db"
	"raise/internal/httpapi"
	"raise/internal/platform"
)

const version = "0.1.0"

// RunAPI serves the HTTP API until ctx is cancelled. Its River client is
// insert-only: the API never works jobs.
func RunAPI(ctx context.Context, cfg Config) error {
	logger := NewLogger(cfg.LogLevel)

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	keys, err := credential.ParseKeyring(cfg.EncryptionKeys)
	if err != nil {
		return err
	}
	registry, err := buildRegistry(cfg, pool, keys, logger)
	if err != nil {
		return err
	}
	riverClient, err := river.NewClient(riverpgxv5.New(pool), &river.Config{Logger: logger})
	if err != nil {
		return err
	}

	sessions := auth.NewSessionManager(pool, cfg.SecureCookies)
	authSvc := auth.NewService(pool, sessions)
	created, err := authSvc.BootstrapAdmin(ctx, cfg.AdminUsername, cfg.AdminPassword)
	if err != nil {
		return fmt.Errorf("creating the first admin from ADMIN_USERNAME: %w", err)
	}
	if created {
		logger.Info("created the first admin from ADMIN_USERNAME", "username", cfg.AdminUsername)
	}
	credSvc := credential.NewService(pool, keys, registry)
	collSvc := collection.NewService(pool, riverClient, registry)

	trustedProxies, err := httpapi.ParseTrustedProxies(cfg.TrustedProxies)
	if err != nil {
		return err
	}
	middleware := append(httpapi.Standard(logger, trustedProxies), sessions.LoadAndSave, authSvc.ResolvePrincipal)
	router, api := httpapi.New(httpapi.Config{Title: "Raise API", Version: version}, middleware...)
	// Must be installed before any operation is registered.
	api.UseMiddleware(auth.RequireRole(api))

	authSvc.RegisterRoutes(api)
	credSvc.RegisterRoutes(api)
	collSvc.RegisterRoutes(api)
	for _, p := range registry.All() {
		p.RegisterRoutes(api)
		if d, ok := p.(platform.Dashboarder); ok {
			platform.RegisterDashboardRoutes(api, d)
		}
		if d, ok := p.(platform.DatasetProvider); ok {
			platform.RegisterDatasetRoutes(api, pool, d)
		}
	}

	srv := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}
	errc := make(chan error, 1)
	go func() {
		logger.Info("api listening", "addr", cfg.HTTPAddr)
		errc <- srv.ListenAndServe()
	}()

	select {
	case err := <-errc:
		return fmt.Errorf("http server: %w", err)
	case <-ctx.Done():
	}
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

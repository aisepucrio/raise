package db

import (
	"context"
	"embed"
	"fmt"
	"io"
	"io/fs"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
	"github.com/riverqueue/river/rivermigrate"
)

//go:embed migrations/*.sql
var migrations embed.FS

func gooseProvider(pool *pgxpool.Pool) (*goose.Provider, error) {
	fsys, err := fs.Sub(migrations, "migrations")
	if err != nil {
		return nil, err
	}
	return goose.NewProvider(goose.DialectPostgres, stdlib.OpenDBFromPool(pool), fsys)
}

// MigrateUp applies River's migrations and then the application's.
func MigrateUp(ctx context.Context, pool *pgxpool.Pool, out io.Writer) error {
	rm, err := rivermigrate.New(riverpgxv5.New(pool), nil)
	if err != nil {
		return err
	}
	res, err := rm.Migrate(ctx, rivermigrate.DirectionUp, nil)
	if err != nil {
		return fmt.Errorf("river migrations: %w", err)
	}
	for _, v := range res.Versions {
		fmt.Fprintf(out, "river: applied version %d\n", v.Version)
	}

	p, err := gooseProvider(pool)
	if err != nil {
		return err
	}
	results, err := p.Up(ctx)
	if err != nil {
		return fmt.Errorf("app migrations: %w", err)
	}
	for _, r := range results {
		fmt.Fprintf(out, "app: applied %s (%s)\n", r.Source.Path, r.Duration)
	}
	return nil
}

// MigrateDown rolls back the latest application migration. River's schema is
// left in place.
func MigrateDown(ctx context.Context, pool *pgxpool.Pool, out io.Writer) error {
	p, err := gooseProvider(pool)
	if err != nil {
		return err
	}
	r, err := p.Down(ctx)
	if err != nil {
		return err
	}
	if r != nil {
		fmt.Fprintf(out, "app: rolled back %s\n", r.Source.Path)
	}
	return nil
}

func MigrateStatus(ctx context.Context, pool *pgxpool.Pool, out io.Writer) error {
	p, err := gooseProvider(pool)
	if err != nil {
		return err
	}
	status, err := p.Status(ctx)
	if err != nil {
		return err
	}
	for _, s := range status {
		applied := "pending"
		if s.State == goose.StateApplied {
			applied = "applied " + s.AppliedAt.Format("2006-01-02 15:04:05")
		}
		fmt.Fprintf(out, "%-32s %s\n", s.Source.Path, applied)
	}
	return nil
}
